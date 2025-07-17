import mongoose from "mongoose";
import SessionModel from "./sessions.model";
import UserActivePlansModel from "../userActivePlans/activePlans.model";
import { getUserActivePlanData } from "../userActivePlans/activePlans.service";
import SessionWorkoutModel from "../sessionWorkout/sessionWorkout.model";
import UserModel from "../users/user.model";
export async function createNewSession(toBeassignedUserId, data: any) {
  try {
    if (!data.sessionItems || data.sessionItems.length == 0) {
      return {
        message: "Session Items is not found",
        success: false,
      };
    }
    if (!data.sessionAgainstType) {
      return {
        message: "Session Against Type is not found",
        success: false,
      };
    }
    let activePlanData;
    if (data.sessionAgainstType == "againstPlan") {
      if (!data.activePlanId) {
        return {
          message: "Active PlanId is not found",
          success: false,
        };
      }
      activePlanData = await getUserActivePlanData(data.activePlanId);
      if (activePlanData.data.length == 0) {
        return {
          message: "Active Plan with given id is not found",
          success: false,
        };
      }

      if (activePlanData.data.userId != toBeassignedUserId) {
        return {
          message: "Active Plan userId and passed userId does not match",
          success: false,
        };
      }

      if (activePlanData.data.remainingSessions <= 0) {
        return {
          message: "No remaining sessions in the active plan",
          success: false,
        };
      }
      if (activePlanData.data.remainingSessions < data.sessionItems.length) {
        return {
          message: `remaining sessions in the active plan are ${activePlanData.data.remainingSessions}, which is less than the number of sessions to be created`,
          success: false,
        };
      }
    }
    if (data.sessionAgainstType == "againstService" && !data.activeServiceId) {
      return {
        message: "Active ServiceId is not found",
        success: false,
      };
    }

    const createdUserSessions = [];
    for (const sessionItem of data.sessionItems) {
      const sessionItemObj = {
        userId: new mongoose.Types.ObjectId(toBeassignedUserId),
        sessionDate: sessionItem.sessionDate,
        sessionTime: sessionItem.sessionTime,
        sessionType: sessionItem.sessionType,
        sessionDuration: sessionItem.sessionDuration,
        sessionStatus: "scheduled",
        sessionAgainstPlan: data.sessionAgainstType == "againstPlan",
      };
      if (sessionItem.sessionType == "offline") {
        sessionItemObj["sessionAddress"] = sessionItem.sessionAddress;
      }
      if (data.sessionAgainstType == "againstPlan") {
        sessionItemObj["activePlanId"] = new mongoose.Types.ObjectId(
          data.activePlanId
        );
      }
      if (sessionItem.trainerId) {
        sessionItemObj["trainerId"] = new mongoose.Types.ObjectId(
          sessionItem.trainerId
        );
      }

      let savedSession = await SessionModel.create(sessionItemObj);
      const currentRemainingSessions =
        activePlanData.data.remainingSessions - 1;
      await UserActivePlansModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(data.activePlanId),
        { remainingSessions: currentRemainingSessions },
        { new: true }
      );
      let savedWorkoutItems = [];

      for (const workoutItem of sessionItem.workoutItems) {
        const workoutItemObj = {
          sessionId: savedSession._id,
          exercise: workoutItem.exercise,
          sets: workoutItem.sets,
          reps: workoutItem.reps,
          isComplete: false,
        };
        if (workoutItem.timer) {
          workoutItemObj["timer"] = workoutItem.timer;
        }
        const savedWorkout = await SessionWorkoutModel.create(workoutItemObj);

        savedWorkoutItems.push(savedWorkout);
      }
      createdUserSessions.push({
        ...savedSession.toObject(),
        workoutItems: savedWorkoutItems,
      });
    }
    //     for (const sessionItem of data) {
    //         if (sessionItem.sessionAgainstPlan) {
    //             const activePlan = await UserActivePlansModel.findById(sessionItem.activePlanId);
    //             if (!activePlan) {
    //                 return {
    //                     message: "Active Plan with given id is not found",
    //                     success: false,
    //                 };
    //             }

    //             if(activePlan.remainingSessions <= 0) {
    //                 return {
    //                     message: "No remaining sessions in the active plan",
    //                     success: false,
    //                 };
    //             }
    //             if(activePlan.remainingSessions < data.length) {
    //                 return {
    //                     message: `remaining sessions in the active plan are ${activePlan.remainingSessions}, which is less than the number of sessions to be created`,
    //                     success: false,
    //                 };
    //             }

    //             // Decrement the remaining sessions in the active plan
    //             activePlan.remainingSessions -= data.length;
    //             await activePlan.save();
    //         }
    //         if(!sessionItem.sessionAgainstPlan){
    //             // const paymentItem = await PaymentModel.findById(sessionItem.paymentItemId);
    //             // if (!paymentItem) {
    //             //     return {
    //             //         message: "Payment item with given id is not found",
    //             //         success: false,
    //             //     };
    //             // }
    //             // if(paymentItem.status !== "success") {
    //             //     return {
    //             //         message: "Payment is not successful for the session",
    //             //         success: false,
    //             //     };
    //             // }
    //         }
    //     }

    // const userSessions = await SessionModel.insertMany(data);

    return {
      message: "Sessions created successfully",
      success: true,
      data: createdUserSessions,
    };
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserSessions(
  userId: string,
  status: boolean | null,
  startDate?: string,
  endDate?: string
) {
  try {
    // if (!userId || !startDate || !endDate) {
    //     return {
    //         success: false,
    //         message: "Missing required fields.",
    //         data: null,
    //     };
    // }

    const queryObj = {
      userId: new mongoose.Types.ObjectId(userId),
      // sessionDate: { $gte: start, $lte: end }
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryObj["sessionDate"] = { $gte: start, $lte: end };
    }
    if (status !== null) {
      queryObj["isActive"] = status;
    }

    const userSessions = await SessionModel.aggregate([
      { $match: queryObj },
      { $sort: { sessionDate: 1 } },

      {
        $lookup: {
          from: "sessionworkouts",
          localField: "_id",
          foreignField: "sessionId",
          as: "workouts",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerBasicDetails",
        },
      },

      {
        $lookup: {
          from: "trainerdetails",
          localField: "trainerId",
          foreignField: "userId",
          as: "trainerAchievements",
        },
      },

      {
        $addFields: {
          trainer: {
            $cond: {
              if: { $gt: [{ $size: "$trainerBasicDetails" }, 0] }, // Only add if trainerBasicDetails exists
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$trainerBasicDetails", 0] }, // Extract plan object
                  {
                    trainerDetails: {
                      $arrayElemAt: ["$trainerExtraDetails", 0],
                    }, //  Nest trainerExtraDetails inside trainer
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove plan if no data exists
            },
          },
        },
      },

      {
        $lookup: {
          from: "useractiveplans",
          localField: "activePlanId",
          foreignField: "_id",
          as: "activePlanDetails",
        },
      },

      {
        $lookup: {
          from: "plans",
          let: {
            planId: { $arrayElemAt: ["$activePlanDetails.plan.planId", 0] },
          },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planId"] } } }],
          as: "planDetails",
        },
      },

      {
        $lookup: {
          from: "planitems",
          let: {
            planItemId: {
              $arrayElemAt: ["$activePlanDetails.plan.planItemId", 0],
            },
          },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planItemId"] } } }],
          as: "planItemDetails",
        },
      },

      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: { $arrayElemAt: ["$planDetails.dietPlanId", 0] } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } }],
          as: "planDietPlanDetails",
        },
      },

      {
        $addFields: {
          "activePlanDetails.plan": {
            $cond: {
              if: { $gt: [{ $size: "$planDetails" }, 0] },
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$planDetails", 0] },
                  {
                    planItem: { $arrayElemAt: ["$planItemDetails", 0] },
                    dietPlanDetails: {
                      $arrayElemAt: ["$planDietPlanDetails", 0],
                    },
                  },
                ],
              },
              else: "$$REMOVE",
            },
          },
        },
      },
      {
        $addFields: {
          activePlanDetails: {
            $arrayElemAt: ["$activePlanDetails", 0],
          },
        },
      },

      {
        $addFields: {
          start: {
            $dateToString: { format: "%Y-%m-%d", date: "$sessionDate" },
          },
          end: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateAdd: {
                  startDate: "$sessionDate",
                  unit: "minute",
                  amount: { $toInt: "$sessionDuration" },
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          color: {
            $cond: [
              { $eq: ["$isActive", false] },
              "grey",
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$sessionStatus", "scheduled"] },
                      then: "orange",
                    },
                    {
                      case: { $eq: ["$sessionStatus", "completed"] },
                      then: "green",
                    },
                    {
                      case: { $eq: ["$sessionStatus", "cancelled"] },
                      then: "red",
                    },
                  ],
                  default: "blue",
                },
              },
            ],
          },
        },
      },

      {
        $project: {
          _id: 1,
          userId: 1,
          trainerId: 1,
          sessionDate: 1,
          sessionTime: 1,
          sessionType: 1,
          sessionDuration: 1,
          sessionAddress: 1,
          sessionStatus: 1,
          sessionFeedback: 1,
          sessionNotes: 1,
          sessionAgainstPlan: 1,
          activePlanId: 1,
          activeServiceId: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          color: 1,
          start: 1,
          end: 1,

          workouts: 1,
          trainer: 1,
          activePlanDetails: 1,
        },
      },
    ]);

    return {
      success: true,
      message: "Fetched successfully!",
      data: userSessions,
    };
  } catch (error) {
    console.log(error.message);

    return {
      success: false,
      message: "Internal server error.",
      data: null,
    };
  }
}

export async function updateSession(
  sessionId: string,
  data: Record<string, any>
) {
  console.log("this is sessionid");
  console.log(data);
  console.log(sessionId);

  try {
    let user;
    if (data.trainerId) {
      user = await UserModel.findById(data.trainerId);
      if (!user) {
        return {
          message: "Trainer with given id is not found",
          success: false,
        };
      }
      if (user.role !== "trainer") {
        return {
          message: "User is not a trainer",
          success: false,
        };
      }
    }
    const updatedSession = await SessionModel.findByIdAndUpdate(
      sessionId,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedSession) {
      return {
        message: "Session not found",
        success: false,
      };
    }
    const respObj = { ...updatedSession.toObject() };
    if (user) {
      respObj["trainerDetails"] = user.toObject();
    }
    return {
      message: "Session updated successfully",
      success: true,
      data: respObj,
    };
  } catch (error) {
    throw new Error(error);
  }
}
