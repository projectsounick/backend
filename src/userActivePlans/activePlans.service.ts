import mongoose from "mongoose";
import UserActivePlansModel from "./activePlans.model";
import dayjs from "dayjs";
import UserModel from "../users/user.model";
import PlanModel, { PlanItemModel, DietPlanModel } from "../Plans/plan.model";
export async function activePlanForUser(userId: string, plans: Array<any>) {
  try {
    const useractiveplansObj = plans.map((item) => {
      const respObj = {
        userId: new mongoose.Types.ObjectId(userId),
      };
      if (item.dietPlanDetails) {
        respObj["dietPlanId"] = new mongoose.Types.ObjectId(
          item.dietPlanDetails._id
        );
        respObj["planStartDate"] = new Date();
        respObj["planEndDate"] = getEndDate(
          item.dietPlanDetails.duration,
          item.dietPlanDetails.durationType
        );
      }
      if (item.plan) {
        respObj["plan"] = {
          planId: new mongoose.Types.ObjectId(item.plan._id),
          planItemId: item.plan.planItem._id,
        };
        respObj["planStartDate"] = new Date();
        respObj["planEndDate"] = getEndDate(
          item.plan.planItem.duration,
          item.plan.planItem.durationType
        );
        respObj["totalSessions"] = item.plan.planItem.sessionCount;
        respObj["remainingSessions"] = item.plan.planItem.sessionCount;
      }

      return respObj;
    });
    const userActivePlans = await UserActivePlansModel.insertMany(
      useractiveplansObj
    );
    return {
      message: "Plans activated successfully",
      success: true,
      data: userActivePlans,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function updateActivePlan(
  activePlanId: string,
  data: Record<string, any>
) {
  try {
    if (data.trainerId) {
      const user = await UserModel.findById(data.trainerId);
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
    const activePlanToBeUpdated = await UserActivePlansModel.findById(
      activePlanId
    );
    if (!activePlanToBeUpdated) {
      return {
        message: "Active Plan with given id is not found",
        success: false,
      };
    }
    const updatedActivePlan = await UserActivePlansModel.findByIdAndUpdate(
      activePlanId,
      { ...data },
      { new: true }
    );
    return {
      message: "Active Plan updated successfully",
      success: true,
      data: updatedActivePlan,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getUserPlanHostory(
  userId: string,
  status: boolean | null
) {
  try {
    const queryObj: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (status !== null) {
      queryObj["isActive"] = status;
    }
    const activePlans = await UserActivePlansModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },
      // Lookup trainer details (if applicable)
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
          as: "trainerExtraDetails",
        },
      },
      // Convert `trainerDetails`, `trainerExtraDetails` into a structured trainer object
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

      // Lookup diet plan details (if applicable)
      {
        $lookup: {
          from: "dietplans",
          localField: "dietPlanId",
          foreignField: "_id",
          as: "dietPlanDetails",
        },
      },
      //Lookup plan details using the nested `plan.planId`
      {
        $lookup: {
          from: "plans",
          let: { planId: "$plan.planId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planId"] } } }],
          as: "planDetails",
        },
      },
      //Lookup plan item details using the nested `plan.planItemId`
      {
        $lookup: {
          from: "planitems",
          let: { planItemId: "$plan.planItemId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planItemId"] } } }],
          as: "planItemDetails",
        },
      },
      // Lookup diet plan details from `planDetails.dietPlanId`
      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: { $arrayElemAt: ["$planDetails.dietPlanId", 0] } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } }],
          as: "planDietPlanDetails",
        },
      },
      // Convert `planDetails`, `planItemDetails`, and `planDietPlanDetails` into a structured plan object
      {
        $addFields: {
          plan: {
            $cond: {
              if: { $gt: [{ $size: "$planDetails" }, 0] }, // Only add if plan exists
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$planDetails", 0] }, // Extract plan object
                  {
                    planItem: { $arrayElemAt: ["$planItemDetails", 0] }, //  Nest planItem inside plan
                    dietPlanDetails: {
                      $arrayElemAt: ["$planDietPlanDetails", 0],
                    }, //  Nest dietPlanDetails inside plan
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove plan if no data exists
            },
          },
        },
      },
      //Ensure final structure
      {
        $project: {
          _id: 1,
          userId: 1,
          dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] },
          plan: 1, //Plan object will appear only if data exists
          planStartDate: 1,
          planEndDate: 1,
          totalSessions: 1,
          remainingSessions: 1,
          dietPlanUrl: 1,
          ddietPlanAssignDate: 1,
          trainerId: 1,
          trainer: 1, // Trainer object will appear only if data exists
          preferredAddress: 1,
          preferredDays: 1,
          preferredTime: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    return {
      message: "Current active Plans fetched successfully",
      success: true,
      data: activePlans,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getUserActivePlanData(activePlanId: string) {
  try {
    const queryObj: any = {
      _id: new mongoose.Types.ObjectId(activePlanId),
      isActive: true,
    };

    const activePlan = await UserActivePlansModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },
      // Lookup trainer details (if applicable)
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
          as: "trainerExtraDetails",
        },
      },
      // Convert `trainerDetails`, `trainerExtraDetails` into a structured trainer object
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

      // Lookup diet plan details (if applicable)
      {
        $lookup: {
          from: "dietplans",
          localField: "dietPlanId",
          foreignField: "_id",
          as: "dietPlanDetails",
        },
      },
      //Lookup plan details using the nested `plan.planId`
      {
        $lookup: {
          from: "plans",
          let: { planId: "$plan.planId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planId"] } } }],
          as: "planDetails",
        },
      },
      //Lookup plan item details using the nested `plan.planItemId`
      {
        $lookup: {
          from: "planitems",
          let: { planItemId: "$plan.planItemId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planItemId"] } } }],
          as: "planItemDetails",
        },
      },
      // Lookup diet plan details from `planDetails.dietPlanId`
      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: { $arrayElemAt: ["$planDetails.dietPlanId", 0] } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } }],
          as: "planDietPlanDetails",
        },
      },
      // Convert `planDetails`, `planItemDetails`, and `planDietPlanDetails` into a structured plan object
      {
        $addFields: {
          plan: {
            $cond: {
              if: { $gt: [{ $size: "$planDetails" }, 0] }, // Only add if plan exists
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$planDetails", 0] }, // Extract plan object
                  {
                    planItem: { $arrayElemAt: ["$planItemDetails", 0] }, //  Nest planItem inside plan
                    dietPlanDetails: {
                      $arrayElemAt: ["$planDietPlanDetails", 0],
                    }, //  Nest dietPlanDetails inside plan
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove plan if no data exists
            },
          },
        },
      },
      //Ensure final structure
      {
        $project: {
          _id: 1,
          userId: 1,
          dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] },
          plan: 1, //Plan object will appear only if data exists
          planStartDate: 1,
          planEndDate: 1,
          totalSessions: 1,
          remainingSessions: 1,
          trainerId: 1,
          trainer: 1, // Trainer object will appear only if data exists
          preferredAddress: 1,
          preferredDays: 1,
          preferredTime: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    return {
      message: "Current active Plans fetched successfully",
      success: true,
      data: activePlan[0],
    };
  } catch (error) {
    throw new Error(error);
  }
}
const getEndDate = (
  duration: number,
  durationType: "day" | "week" | "month" | "year"
) => {
  let endDate;

  switch (durationType) {
    case "day":
      endDate = dayjs().add(duration, "day");
      break;
    case "week":
      endDate = dayjs().add(duration, "week");
      break;
    case "month":
      endDate = dayjs().add(duration, "month");
      break;
    case "year":
      endDate = dayjs().add(duration, "year");
      break;
    default:
      throw new Error("Invalid duration type");
  }

  return endDate.format("YYYY-MM-DD"); // ✅ Returns formatted end date
};

/////Funciton for assigning the diet plan pdf url to the user------------------------/
export async function updateDietPlanPdf(
  dietPlanUrl: string,
  activePlanId: string
) {
  try {
    const response = await UserActivePlansModel.findOneAndUpdate(
      { _id: activePlanId },
      {
        $set: {
          dietPlanUrl: dietPlanUrl,
          dietPlanAssignDate: Date.now(),
        },
      },
      { new: true } // <- This returns the updated document
    );

    if (response) {
      return {
        message: `Pdf has been assigned`,
        success: true,
        data: {
          dietPlanUrl: dietPlanUrl,
          dietPlanAssignDate: response.dietPlanAssignDate, // now available
        },
      };
    } else {
      return {
        message: "Unable to assign the diet plan pdf",
        success: false,
        data: {
          dietPlanUrl: null,
          dietPlanAssignDate: null,
        },
      };
    }
  } catch (error: any) {
    return {
      message: error.message,
      success: false,
      data: {
        dietPlanUrl: null,
        dietPlanAssignDate: null,
      },
    };
  }
}


export async function assignPlanToUser(userId: string, planId: string, planItemId: string) {
  try {
    const alreadyActivePlans = await UserActivePlansModel.findOne({userId:new mongoose.Types.ObjectId(userId), 'plan.planId': new mongoose.Types.ObjectId(planId)})
    if(alreadyActivePlans){
      return {
        message: "Plan already assigned to user",
        success: false,
      };
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        message: "User with given id is not found",
        success: false,
      };
    }
    if (user.role !== "user") {
      return {
        message: "Not a valid user",
        success: false,
      };
    }
    const plan = await PlanModel.findById(planId);
    if(!plan){
      return {
        message: "Plan with given id is not found",
        success: false,
      };
    }



    const planItem = await PlanItemModel.findById(planItemId);
    if(!planItem){
      return {
        message: "Plan Item with given id is not found",
        success: false,
      };
    }

    const respObj = {
      userId: new mongoose.Types.ObjectId(userId),
      plan: {
        planId: new mongoose.Types.ObjectId(planId),
        planItemId: new mongoose.Types.ObjectId(planItemId)
      }
    };
    respObj["planStartDate"] = new Date();
    respObj["planEndDate"] = getEndDate(
      planItem.duration,
      planItem.durationType
    );
    respObj["totalSessions"] = planItem.sessionCount;
    respObj["remainingSessions"] = planItem.sessionCount;

    const userActivePlan = await UserActivePlansModel.insertOne(respObj);
    return {
      message: "Plans activated successfully",
      success: true,
      data: userActivePlan,
    };

  } catch (error) {
  throw new Error(error);
}

}

export async function assignDietPlanToUser(userId: string, dietPlanId: string) {
  try {
    const alreadyActivePlans = await UserActivePlansModel.findOne({userId:new mongoose.Types.ObjectId(userId), dietPlanId: new mongoose.Types.ObjectId(dietPlanId)})
    if(alreadyActivePlans){
      return {
        message: "Plan already assigned to user",
        success: false,
      };
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        message: "User with given id is not found",
        success: false,
      };
    }
    if (user.role !== "user") {
      return {
        message: "Not a valid user",
        success: false,
      };
    }
    const dietPlan = await DietPlanModel.findById(dietPlanId);
    if(!dietPlan){
      return {
        message: "Diet Plan with given id is not found",
        success: false,
      };
    }

    const respObj = {
      userId: new mongoose.Types.ObjectId(userId),
      dietPlanId: new mongoose.Types.ObjectId(dietPlanId)
    };
    respObj["planStartDate"] = new Date();
    respObj["planEndDate"] = getEndDate(
      dietPlan.duration,
      dietPlan.durationType
    );

    const userActivePlan = await UserActivePlansModel.insertOne(respObj);
    return {
      message: "Plans activated successfully",
      success: true,
      data: userActivePlan,
    };

  } catch (error) {
  throw new Error(error);
}

}