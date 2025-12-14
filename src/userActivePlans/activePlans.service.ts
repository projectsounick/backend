import mongoose from "mongoose";
import UserActivePlansModel from "./activePlans.model";
import dayjs from "dayjs";
import UserModel from "../users/user.model";
import PlanModel, { PlanItemModel, DietPlanModel } from "../Plans/plan.model";
import UserActiveServicesModel from "./activeServices.model";
import ServiceModel from "../services/services.model";
import { sendBulkPushNotificationsAndSave } from "../Notification/notification.service";
import { notificationContentForPlanAssign } from "../utils/staticNotificaitonContent";
import { log } from "node:console";

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
export async function getUserPlanHostoryNew(
  userId: string,
  status: boolean | null
) {
  try {
    console.log("went here");

    const queryObj: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (status !== null) {
      queryObj["isActive"] = status;
    }
    const activePlans = await UserActivePlansModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },

      // Lookup plan details
      {
        $lookup: {
          from: "plans",
          let: { planId: "$plan.planId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planId"] } } }],
          as: "planDetails",
        },
      },

      // Flatten and keep only needed fields
      {
        $addFields: {
          plan: {
            $cond: {
              if: { $gt: [{ $size: "$planDetails" }, 0] },
              then: {
                _id: { $arrayElemAt: ["$planDetails._id", 0] },
                title: { $arrayElemAt: ["$planDetails.title", 0] },
                imgUrl: { $arrayElemAt: ["$planDetails.imgUrl", 0] },
                descItems: { $arrayElemAt: ["$planDetails.descItems", 0] },
                isActive: { $arrayElemAt: ["$planDetails.isActive", 0] },
              },
              else: "$$REMOVE",
            },
          },
        },
      },

      // Final projection
      {
        $project: {
          _id: 1,
          isActive: 1,
          "plan.title": 1,
          "plan.imgUrl": 1,
          "plan.descItems": 1,
          "plan.isActive": 1,
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

export async function getUserDietUrls(userId: string) {
  try {
    const queryObj: any = { userId: new mongoose.Types.ObjectId(userId) };

    const userActivePlans = await UserActivePlansModel.find({
      userId,
      isActive: true,
      dietPlanUrl: { $exists: true, $ne: "" },
    })
      .populate({
        path: "dietPlanId",
        model: "dietplans",
        select: "_id title",
      })
      .populate({
        path: "plan.planId",
        model: "plans",
        populate: {
          path: "dietPlanId",
          model: "dietplans",
          select: "_id title",
        },
      })
      .select("dietPlanUrl dietPlanId plan");

    return {
      message: "Current diet plan urls fetched successfully",
      success: true,
      data: userActivePlans,
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

export async function assignPlanToUser(
  userId: string,
  planId: string,
  planItemId: string,
  callingUserId:string
) {
  try {
    const alreadyActivePlans = await UserActivePlansModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      "plan.planId": new mongoose.Types.ObjectId(planId),
    });
    if (alreadyActivePlans && alreadyActivePlans.isActive === true) {
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
    if (!plan) {
      return {
        message: "Plan with given id is not found",
        success: false,
      };
    }

    const planItem = await PlanItemModel.findById(planItemId);
    if (!planItem) {
      return {
        message: "Plan Item with given id is not found",
        success: false,
      };
    }

    const respObj = {
      userId: new mongoose.Types.ObjectId(userId),
      plan: {
        planId: new mongoose.Types.ObjectId(planId),
        planItemId: new mongoose.Types.ObjectId(planItemId),
      },
    };
    respObj["planStartDate"] = new Date();
    respObj["planEndDate"] = getEndDate(
      planItem.duration,
      planItem.durationType
    );
    respObj["totalSessions"] = planItem.sessionCount;
    respObj["remainingSessions"] = planItem.sessionCount;

    const userActivePlan = await UserActivePlansModel.insertOne(respObj);

    const users = await UserModel.find({
      _id: new mongoose.Types.ObjectId(userId),
    })
      .select("expoPushToken")
      .lean();
    const notificationContent = notificationContentForPlanAssign;
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
      message: "Plans activated successfully",
      success: true,
      data: userActivePlan,
    };
  } catch (error) {
    throw new Error(error);
  }
}

export async function assignDietPlanToUser(userId: string, dietPlanId: string,callingUserId:string) {
  try {
    const alreadyActivePlans = await UserActivePlansModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      dietPlanId: new mongoose.Types.ObjectId(dietPlanId),
    });
    if (alreadyActivePlans) {
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
    if (!dietPlan) {
      return {
        message: "Diet Plan with given id is not found",
        success: false,
      };
    }

    const respObj = {
      userId: new mongoose.Types.ObjectId(userId),
      dietPlanId: new mongoose.Types.ObjectId(dietPlanId),
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

export async function activeServiceUser(userId: string, services: Array<any>) {
  try {
    const useractiveserviceObj = services.map((item) => {
      const respObj = {
        userId: new mongoose.Types.ObjectId(userId),
        serviceId: new mongoose.Types.ObjectId(item.serviceDetails._id),
        totalSessions: item.serviceDetails.sessionCount,
        remainingSessions: item.serviceDetails.sessionCount,
      };
      return respObj;
    });
    const userActiveServices = await UserActiveServicesModel.insertMany(
      useractiveserviceObj
    );
    return {
      message: "Services activated successfully",
      success: true,
      data: userActiveServices,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getUserServiceHistory(
  userId: string,
  status: boolean | null
) {
  try {
    const queryObj: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (status !== null) {
      queryObj["isActive"] = status;
    }
    const activePlans = await UserActiveServicesModel.aggregate([
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
      //  Convert `trainerDetails`, `trainerExtraDetails` into a structured trainer object
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
      // Lookup service details (if applicable)
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      //Ensure final structure
      {
        $project: {
          _id: 1,
          userId: 1,
          serviceDetails: { $arrayElemAt: ["$serviceDetails", 0] },
          totalSessions: 1,

          remainingSessions: 1,
          trainerId: 1,
          trainer: 1, // Trainer object will appear only if data exists
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    return {
      message: "Current active services fetched successfully",
      success: true,
      data: activePlans,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getUserServiceHistoryNew(
  userId: string,
  status: boolean | null
) {
  try {
    const queryObj: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (status !== null) {
      queryObj["isActive"] = status;
    }
    const activePlans = await UserActiveServicesModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },

      // Lookup service details
      {
        $lookup: {
          from: "services",
          let: { serviceId: "$serviceId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$serviceId"] } } },
            {
              $project: {
                _id: 1,
                title: 1,
                imgUrl: 1,
                descItems: 1,
                isActive: 1,
                isCorporate: 1,
              },
            }, // only required fields
          ],
          as: "serviceDetails",
        },
      },

      // Flatten serviceDetails
      {
        $addFields: {
          serviceDetails: { $arrayElemAt: ["$serviceDetails", 0] },
        },
      },

      // Final projection
      {
        $project: {
          _id: 1,
          isActive: 1,
          "serviceDetails.title": 1,
          "serviceDetails.imgUrl": 1,
          "serviceDetails.descItems": 1,
          "serviceDetails.isActive": 1,
          "serviceDetails.isCorporate": 1,
        },
      },
    ]);
    return {
      message: "Current active services fetched successfully",
      success: true,
      data: activePlans,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getUserTrainers(userId: string) {
  try {
    // Get all active plans with trainerId where isActive is true
    const activePlans = await UserActivePlansModel.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
      trainerId: { $exists: true, $ne: null },
    }).select("trainerId");

    // Get all active services with trainerId where isActive is true
    const activeServices = await UserActiveServicesModel.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
      trainerId: { $exists: true, $ne: null },
    }).select("trainerId");

    // Extract unique trainer IDs
    const trainerIds = new Set<string>();
    activePlans.forEach((plan) => {
      if (plan.trainerId) {
        trainerIds.add(plan.trainerId.toString());
      }
    });
    activeServices.forEach((service) => {
      if (service.trainerId) {
        trainerIds.add(service.trainerId.toString());
      }
    });

    // Convert Set to Array of ObjectIds
    const uniqueTrainerIds = Array.from(trainerIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    if (uniqueTrainerIds.length === 0) {
      return {
        message: "No trainers found for this user",
        success: true,
        data: [],
      };
    }

    // Fetch trainer details (excluding mobile and email)
    const trainers = await UserModel.find({
      _id: { $in: uniqueTrainerIds },
      role: "trainer",
      isActive: true,
    })
      .select("-phoneNumber -email -otp -expoPushToken -appleId")
      .lean();

    return {
      message: "Trainers fetched successfully",
      success: true,
      data: trainers,
    };
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateActiveService(
  activeServiceId: string,
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
    const activeServiceToBeUpdated = await UserActiveServicesModel.findById(
      activeServiceId
    );
    if (!activeServiceToBeUpdated) {
      return {
        message: "Active Service with given id is not found",
        success: false,
      };
    }
    const updatedActiveService =
      await UserActiveServicesModel.findByIdAndUpdate(
        activeServiceId,
        { ...data },
        { new: true }
      );
    return {
      message: "Active Service updated successfully",
      success: true,
      data: updatedActiveService,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getUserActiveServiceData(activeServiceId: string) {
  try {
    const queryObj: any = {
      _id: new mongoose.Types.ObjectId(activeServiceId),
      isActive: true,
    };

    const activeService = await UserActiveServicesModel.aggregate([
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
      // Lookup service details (if applicable)
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      //Ensure final structure
      {
        $project: {
          _id: 1,
          userId: 1,
          serviceDetails: { $arrayElemAt: ["$serviceDetails", 0] },
          totalSessions: 1,
          remainingSessions: 1,
          trainerId: 1,
          trainer: 1, // Trainer object will appear only if data exists
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    return {
      message: "Current active Service fetched successfully",
      success: true,
      data: activeService[0],
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function assignServiceToUser(userId: string, ServiceId: string) {
  try {
    const alreadyActiveService = await UserActiveServicesModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      serviceId: new mongoose.Types.ObjectId(ServiceId),
    });
    if (alreadyActiveService) {
      return {
        message: "Service already assigned to user",
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
    const service = await ServiceModel.findById(ServiceId);
    if (!service) {
      return {
        message: "Service with given id is not found",
        success: false,
      };
    }

    const respObj = {
      userId: new mongoose.Types.ObjectId(userId),
      serviceId: new mongoose.Types.ObjectId(ServiceId),
      totalSessions: service.sessionCount,
      remainingSessions: service.sessionCount,
    };

    const userActiveService = await UserActiveServicesModel.insertOne(respObj);
    return {
      message: "Service activated successfully",
      success: true,
      data: userActiveService,
    };
  } catch (error) {
    throw new Error(error);
  }
}
