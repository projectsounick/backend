import mongoose from "mongoose";
import SessionModel from "./sessions.model";
import UserActivePlansModel from "../userActivePlans/activePlans.model";
import {
  getUserActivePlanData,
  getUserActiveServiceData,
} from "../userActivePlans/activePlans.service";
import SessionWorkoutModel from "../sessionWorkout/sessionWorkout.model";
import UserModel from "../users/user.model";
import UserActiveServicesModel from "../userActivePlans/activeServices.model";
import {
  createNotification,
  sendBulkPushNotificationsAndSave,
} from "../Notification/notification.service";
import {
  notificationContentForSessionCanceled,
  notificationContentForSessionCompleted,
  notificationContentForSessionCreated,
} from "../utils/staticNotificaitonContent";
export async function createNewSession(
  toBeassignedUserId,
  data: any,
  callingUserId: string
) {
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
    let activeServiceData;
    if (data.sessionAgainstType == "againstService") {
      if (!data.activeServiceId) {
        return {
          message: "Active ServiceId is not found",
          success: false,
        };
      }
      activeServiceData = await getUserActiveServiceData(data.activeServiceId);
      if (activeServiceData.data.length == 0) {
        return {
          message: "Active Service with given id is not found",
          success: false,
        };
      }
      if (activeServiceData.data.userId != toBeassignedUserId) {
        return {
          message: "Active Service userId and passed userId does not match",
          success: false,
        };
      }

      if (activeServiceData.data.remainingSessions <= 0) {
        return {
          message: "No remaining sessions in the active plan",
          success: false,
        };
      }
      if (activeServiceData.data.remainingSessions < data.sessionItems.length) {
        return {
          message: `remaining sessions in the active service are ${activeServiceData.data.remainingSessions}, which is less than the number of sessions to be created`,
          success: false,
        };
      }
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
      if (data.sessionAgainstType == "againstService") {
        sessionItemObj["activeServiceId"] = new mongoose.Types.ObjectId(
          data.activeServiceId
        );
      }
      if (sessionItem.trainerId) {
        sessionItemObj["trainerId"] = new mongoose.Types.ObjectId(
          sessionItem.trainerId
        );
      }

      let savedSession = await SessionModel.create(sessionItemObj);

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

    if (data.sessionAgainstType == "againstPlan") {
      const currentRemainingSessions =
        activePlanData.data.remainingSessions - createdUserSessions.length;
      await UserActivePlansModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(data.activePlanId),
        { remainingSessions: currentRemainingSessions },
        { new: true }
      );
    }
    if (data.sessionAgainstType == "againstService") {
      const currentRemainingSessions =
        activeServiceData.data.remainingSessions - createdUserSessions.length;
      await UserActiveServicesModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(data.activeServiceId),
        { remainingSessions: currentRemainingSessions },
        { new: true }
      );
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

    // To Send Notification to user about the new session assigned to them
    const users = await UserModel.find({
      _id: new mongoose.Types.ObjectId(toBeassignedUserId),
    })
      .select("expoPushToken")
      .lean();
    const notificationContent = notificationContentForSessionCreated;
    if (users.length > 0) {
      sendBulkPushNotificationsAndSave(
        notificationContent.title,
        notificationContent.body,
        users.map((user) => {
          return {
            ...user,
            senderId: callingUserId,
          };
        }),
        "user"
      )
        .then(() => console.log("Background notification triggred."))
        .catch((err) =>
          console.error("Error generating sending notification:", err)
        );
    }

    return {
      message: "Sessions created successfully",
      success: true,
      data: createdUserSessions,
    };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

export async function getUserSessions(
  userId: string,
  status: boolean | null,
  startDate: string,
  endDate: string,
  activePlanId: string,
  activeServiceId: string,
  latest: any
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

    // Active Plan filter
    if (activePlanId) {
      queryObj["activePlanId"] = new mongoose.Types.ObjectId(activePlanId);
    }

    // Active Service filter
    if (activeServiceId) {
      queryObj["activeServiceId"] = new mongoose.Types.ObjectId(
        activeServiceId
      );
    }
    console.log("this is queryobj");
    console.log(queryObj);

    const userSessions = await SessionModel.aggregate([
      { $match: queryObj },
      { $sort: { sessionDate: 1 } },
      // Workouts lookup
      {
        $lookup: {
          from: "sessionworkouts",
          localField: "_id",
          foreignField: "sessionId",
          as: "workouts",
        },
      },
      // Trainer basic details
      {
        $lookup: {
          from: "users",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerBasicDetails",
        },
      },
      // Trainer achievements
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
      // Active Plan Details
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

      // Active Service Details (like Plan)
      {
        $lookup: {
          from: "useractiveservices",
          localField: "activeServiceId",
          foreignField: "_id",
          as: "activeServiceDetails",
        },
      },
      {
        $lookup: {
          from: "services",
          let: {
            serviceId: { $arrayElemAt: ["$activeServiceDetails.serviceId", 0] },
          },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$serviceId"] } } }],
          as: "serviceInfo",
        },
      },
      {
        $addFields: {
          "activeServiceDetails.service": {
            $cond: {
              if: { $gt: [{ $size: "$serviceInfo" }, 0] },
              then: { $arrayElemAt: ["$serviceInfo", 0] },
              else: "$$REMOVE",
            },
          },
        },
      },
      {
        $addFields: {
          activeServiceDetails: { $arrayElemAt: ["$activeServiceDetails", 0] },
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
          activeServiceDetails: 1,
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
  data: Record<string, any>,
  userId: string
) {
  console.log("this is data");
  console.log(data);

  //// feedback storing in notification for the admin -------/
  try {
    if (data.sessionFeedback) {
      await createNotification({
        title: "Session notificaiton",
        body: `User has given a feedback of ${data.sessionFeedback}`,
        isAdmin: true,
        userId: userId,
      });
    }
  } catch (error) {}
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
    if (data.sessionStatus == "cancelled") {
      const sessionDetails = await SessionModel.findById(sessionId);
      if (sessionDetails.sessionAgainstPlan) {
        await UserActivePlansModel.findOneAndUpdate(
          {
            _id: sessionDetails.activePlanId,
            $expr: { $lt: ["$remainingSessions", "$totalSessions"] }, // only update if remaining < total
          },
          {
            $inc: { remainingSessions: 1 },
            $set: { updatedAt: new Date() },
          },
          { new: true }
        );
      } else {
        await UserActiveServicesModel.findOneAndUpdate(
          {
            _id: sessionDetails.activeServiceId,
            $expr: { $lt: ["$remainingSessions", "$totalSessions"] }, // only update if remaining < total
          },
          {
            $inc: { remainingSessions: 1 },
            $set: { updatedAt: new Date() },
          },
          { new: true }
        );
      }
      const users = await UserModel.find({
        _id: new mongoose.Types.ObjectId(sessionDetails.userId),
      })
        .select("expoPushToken")
        .lean();
      const notificationContent = notificationContentForSessionCanceled;
      if (users.length > 0) {
        sendBulkPushNotificationsAndSave(
          notificationContent.title,
          notificationContent.body,
          users.map((user) => {
            return {
              ...user,
              senderId: userId,
            };
          }),
          "user"
        )
          .then(() => console.log("Background notification triggred."))
          .catch((err) =>
            console.error("Error generating sending notification:", err)
          );
      }
    }

    if (data.sessionStatus == "completed") {
      const sessionDetails = await SessionModel.findById(sessionId);
      const users = await UserModel.find({
        _id: new mongoose.Types.ObjectId(sessionDetails.userId),
      })
        .select("expoPushToken")
        .lean();
      const notificationContent = notificationContentForSessionCompleted;
      if (users.length > 0) {
        sendBulkPushNotificationsAndSave(
          notificationContent.title,
          notificationContent.body,
          users.map((user) => {
            return {
              ...user,
              senderId: userId,
            };
          }),
          "user"
        )
          .then(() => console.log("Background notification triggred."))
          .catch((err) =>
            console.error("Error generating sending notification:", err)
          );
      }
    }

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
    try {
      if (data?.sessoionStatus) {
      }
    } catch (error) {}

    return {
      message: "Session updated successfully",
      success: true,
      data: respObj,
    };
  } catch (error) {
    throw new Error(error);
  }
}
