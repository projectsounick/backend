import PlanModel, { PlanTypeModel, PlanItemModel, DietPlanModel } from "./plan.model";
import mongoose from "mongoose";

//// Function for Plan Types
export async function addPlanType(data: Record<string, any>) {
  try {
    console.log("this is data");
    console.log(data);

    const savedPlanType = await PlanTypeModel.create({ ...data });
    return {
      message: "Plan type added successfully",
      success: true,
      data: savedPlanType,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getPlanType(
  status: boolean,
  page?: string,
  limit?: string
) {
  try {
    console.log("called here");

    let savedPlanType;
    let paginationInfo = null;
    const queryObj: any = {};
    if (status !== null) {
      queryObj["isActive"] = status;
    }

    if (page && limit) {
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      const pageNumber = parsedPage > 0 ? parsedPage : 1;
      const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
      const skip = (pageNumber - 1) * itemsPerPage;

      savedPlanType = await PlanTypeModel.find(queryObj)
        .sort({ createdAt: -1, isActive: -1 })
        .skip(skip)
        .limit(itemsPerPage);

      const totalItems = await PlanTypeModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      paginationInfo = {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      };
    } else {
      savedPlanType = await PlanTypeModel.find(queryObj).sort({
        createdAt: -1,
      });
    }

    return {
      message: "Plan types fetched successfully",
      success: true,
      data: savedPlanType,
      pagination: paginationInfo,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function updatePlanType(
  planTypeId: string,
  data: Record<string, any>
) {
  try {
    const planTypeToBeUpdated = await PlanTypeModel.findById(planTypeId);
    if (!planTypeToBeUpdated) {
      return {
        message: "Plan type with given id is not found",
        success: false,
      };
    }
    const updatedPlanType = await PlanTypeModel.findByIdAndUpdate(
      planTypeId,
      { ...data },
      { new: true }
    );
    return {
      message: "Plan types updated successfully",
      success: true,
      data: updatedPlanType,
    };
  } catch (error) {
    throw new Error(error);
  }
}

//// Function for Plans
export async function addPlan(data: Record<string, any>) {
  try {
    if (!data.planItems || data.planItems.length === 0) {
      return {
        message: "Plan items are required",
        success: false,
      };
    }
    const planObj = {
      planTypeId: data.planTypeId,
      title: data.title,
      descItems: data.descItems,
      imgUrl: data.imgUrl,
    };
    if (data.dietPlanId) {
      planObj['dietPlanId'] = new mongoose.Types.ObjectId(data.dietPlanId);
    }
    const savedPlan = await PlanModel.create(planObj);

    const planItems = data.planItems.map((item: any) => ({
      planId: savedPlan._id,
      ...item,
    }));

    const savedPlanItems = await PlanItemModel.insertMany(planItems);

    return {
      message: "Plan added successfully",
      success: true,
      data: { ...savedPlan.toObject(), planItems: savedPlanItems },
    };
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
}
export async function getPlan(status: boolean, planItemStatus: Array<boolean>, page?: string, limit?: string) {
  try {
    let savedPlan;
    let paginationInfo = null;
    const queryObj: any = {};
    if (status !== null) {
      queryObj["isActive"] = status;
    }

    if (page && limit) {
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      const pageNumber = parsedPage > 0 ? parsedPage : 1;
      const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
      const skip = (pageNumber - 1) * itemsPerPage;

      savedPlan = await PlanModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1, isActive: -1 } },
        { $skip: skip },
        { $limit: itemsPerPage },
        {
          $lookup: {
            from: "plantypes",
            localField: "planTypeId",
            foreignField: "_id",
            as: "planType",
          },
        },
        {
          $set: {
            planType: { $arrayElemAt: ["$planType", 0] }
          }
        },
        {
          $lookup: {
            from: "dietplans",
            localField: "dietPlanId",
            foreignField: "_id",
            as: "dietPlanDetails",
          },
        },
        {
          $set: {
            dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] }
          }
        },
        // Lookup plan items **WITH STATUS FILTER**
        {
          $lookup: {
            from: "planitems",
            let: { planId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$planId", "$$planId"] },
                      { $in: ["$isActive", [...planItemStatus]] },
                      // { $eq: ["$isActive", true] }
                    ]
                  }
                }
              }
            ],
            as: "planItems",
          },
        },
      ]);

      const totalItems = await PlanModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      paginationInfo = {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      };
    } else {
      savedPlan = await PlanModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1, isActive: -1 } },
        {
          $lookup: {
            from: "plantypes",
            localField: "planTypeId",
            foreignField: "_id",
            as: "planType",
          },
        },
        {
          $set: {
            planType: { $arrayElemAt: ["$planType", 0] }
          }
        },
        {
          $lookup: {
            from: "dietplans",
            localField: "dietPlanId",
            foreignField: "_id",
            as: "dietPlanDetails",
          },
        },
        {
          $set: {
            dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] }
          }
        },
        // Lookup plan items **WITH STATUS FILTER**
        {
          $lookup: {
            from: "planitems",
            let: { planId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$planId", "$$planId"] },
                      { $in: ["$isActive", [...planItemStatus]] },
                      // { $eq: ["$isActive", true] }
                    ]
                  }
                }
              }
            ],
            as: "planItems",
          },
        },
      ]);
    }

    return {
      message: "Plan fetched successfully",
      success: true,
      data: savedPlan,
      pagination: paginationInfo,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function updatePlan(planId: string, data: Record<string, any>) {
  try {
    const planToBeUpdated = await PlanModel.findById(planId);
    if (!planToBeUpdated) {
      return {
        message: "Plan with given id is not found",
        success: false,
      };
    }
    const updatedPlan = await PlanModel.findByIdAndUpdate(
      planId,
      { ...data },
      { new: true }
    );
    return {
      message: "Plan updated successfully",
      success: true,
      data: updatedPlan,
    };
  } catch (error) {
    throw new Error(error);
  }
}

//// Function for Plan Item
export async function addPlanItem(planId: string, data: Record<string, any>) {
  try {
    const planToBeUpdated = await PlanModel.findById(planId);
    if (!planToBeUpdated) {
      return {
        message: "Plan with given id is not found",
        success: false,
      };
    }

    const planItemObj = {
      planId,
      ...data,
    };
    const savedPlanItem = await PlanItemModel.create(planItemObj);
    return {
      message: "Plan item added successfully",
      success: true,
      data: savedPlanItem,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function updatePlanItem(
  planItemId: string,
  data: Record<string, any>
) {
  try {
    const planItemToBeUpdated = await PlanItemModel.findById(planItemId);
    if (!planItemToBeUpdated) {
      return {
        message: "Plan item with given id is not found",
        success: false,
      };
    }
    const updatedPlanItem = await PlanItemModel.findByIdAndUpdate(
      planItemId,
      { ...data },
      { new: true }
    );
    return {
      message: "Plan item updated successfully",
      success: true,
      data: updatedPlanItem,
    };
  } catch (error) {
    throw new Error(error);
  }
}


//// Function for Diet Plans
export async function addDietPlan(data: Record<string, any>) {
  try {
    const dietPlanObj = {
      title: data.title,
      descItems: data.descItems,
      imgUrl: data.imgUrl,
      duration: data.duration,
      durationType: data.durationType,
      price: data.price
    };
    const savedDietPlan = await DietPlanModel.create(dietPlanObj);
    return {
      message: "Diet plan added successfully",
      success: true,
      data: savedDietPlan,
    };
  } catch (error) {
    console.log(error.message);

    throw new Error(error);
  }
}
export async function getDietPlan(status: boolean, page?: string, limit?: string) {
  try {
    let savedDietPlan;
    let paginationInfo = null;
    const queryObj: any = {};
    if (status !== null) {
      queryObj["isActive"] = status;
    }

    if (page && limit) {
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      const pageNumber = parsedPage > 0 ? parsedPage : 1;
      const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
      const skip = (pageNumber - 1) * itemsPerPage;

      savedDietPlan = await DietPlanModel.find(queryObj).skip(skip).limit(itemsPerPage).sort({ createdAt: -1, isActive: -1 });

      const totalItems = await DietPlanModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      paginationInfo = {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      };
    } else {
      savedDietPlan = await DietPlanModel.find(queryObj).sort({ createdAt: -1, isActive: -1 });
    }

    return {
      message: "Diet plan fetched successfully",
      success: true,
      data: savedDietPlan,
      pagination: paginationInfo,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function updateDietPlan(dietPlanId: string, data: Record<string, any>) {
  try {
    const dietPlanToBeUpdated = await DietPlanModel.findById(dietPlanId);
    if (!dietPlanToBeUpdated) {
      return {
        message: "Diet plan with given id is not found",
        success: false,
      };
    }
    const updatedDietPlan = await DietPlanModel.findByIdAndUpdate(
      dietPlanId,
      { ...data },
      { new: true }
    );
    return {
      message: "Diet plan updated successfully",
      success: true,
      data: updatedDietPlan,
    };
  } catch (error) {
    throw new Error(error);
  }
}