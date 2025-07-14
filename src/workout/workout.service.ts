import ExerciseModel, { WorkoutPlanModel } from "./workout.model";
import mongoose from "mongoose";

export async function addExercise(data: Record<string, any>) {
  try {
    const savedExercise = await ExerciseModel.create({ ...data });
    return {
      message: "Exercise added successfully",
      success: true,
      data: savedExercise,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getExercise(status?: any, page?: string, limit?: string) {
  try {
    let savedExercise;
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

      savedExercise = await ExerciseModel.find(queryObj)
        .sort({ createdAt: -1, isActive: -1 })
        .skip(skip)
        .limit(itemsPerPage);

      const totalItems = await ExerciseModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      paginationInfo = {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      };
    } else {
      savedExercise = await ExerciseModel.find(queryObj).sort({
        createdAt: -1,
      });
    }

    return {
      message: "Exercises fetched successfully",
      success: true,
      data: savedExercise,
      pagination: paginationInfo,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function updateExercise(
  ExerciseId: string,
  data: Record<string, any>
) {
  try {
    const exerciseToBeUpdated = await ExerciseModel.findById(ExerciseId);
    if (!exerciseToBeUpdated) {
      return {
        message: "Exercise with given id is not found",
        success: false,
      };
    }
    const updatedExercise = await ExerciseModel.findByIdAndUpdate(
      ExerciseId,
      { ...data },
      { new: true }
    );
    return {
      message: "Exercise updated successfully",
      success: true,
      data: updatedExercise,
    };
  } catch (error) {
    throw new Error(error);
  }
}

export async function addWorkoutPLan(data: Record<string, any>) {
  try {
    if (!data.planName) {
      return {
        message: "Plan name is required",
        success: false,
        data: null,
      };
    }
    if (
      !data.sun ||
      !data.mon ||
      !data.tue ||
      !data.wed ||
      !data.thu ||
      !data.fri ||
      !data.sat
    ) {
      return {
        message: "Plan days are required",
        success: false,
        data: null,
      };
    }
    const planObj = { ...data };
    const savedWorkoutPlan = await WorkoutPlanModel.create(planObj);

    const populatedPlan = await WorkoutPlanModel.findById(savedWorkoutPlan._id)
      .populate("sun.exercise")
      .populate("mon.exercise")
      .populate("tue.exercise")
      .populate("wed.exercise")
      .populate("thu.exercise")
      .populate("fri.exercise")
      .populate("sat.exercise");

    return {
      message: "Plan added successfully",
      success: true,
      data: populatedPlan,
    };
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
}
export async function getPlans(
  status?: boolean,
  page?: string,
  limit?: string
) {
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

      savedPlan = await WorkoutPlanModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1, isActive: -1 } },
        { $skip: skip },
        { $limit: itemsPerPage },
        {
          $lookup: {
            from: "exercises",
            localField: "sun.exercise",
            foreignField: "_id",
            as: "sun.exerciseDetails",
          },
        },
        {
          $lookup: {
            from: "exercises",
            localField: "mon.exercise",
            foreignField: "_id",
            as: "mon.exerciseDetails",
          },
        },
        {
          $lookup: {
            from: "exercises",
            localField: "tue.exercise",
            foreignField: "_id",
            as: "tue.exerciseDetails",
          },
        },
        {
          $lookup: {
            from: "exercises",
            localField: "wed.exercise",
            foreignField: "_id",
            as: "wed.exerciseDetails",
          },
        },
        {
          $lookup: {
            from: "exercises",
            localField: "thu.exercise",
            foreignField: "_id",
            as: "thu.exerciseDetails",
          },
        },
        {
          $lookup: {
            from: "exercises",
            localField: "fri.exercise",
            foreignField: "_id",
            as: "fri.exerciseDetails",
          },
        },
        {
          $lookup: {
            from: "exercises",
            localField: "sat.exercise",
            foreignField: "_id",
            as: "sat.exerciseDetails",
          },
        },

        // Optionally, project the fields you want
        {
          $project: {
            planName: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            sun: 1,
            mon: 1,
            tue: 1,
            wed: 1,
            thu: 1,
            fri: 1,
            sat: 1,
          },
        },
      ]);

      const totalItems = await WorkoutPlanModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      paginationInfo = {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      };
    } else {
      savedPlan = await WorkoutPlanModel.find(queryObj)
        .sort({ createdAt: -1, isActive: -1 })

        .populate("sun.exercise")
        .populate("mon.exercise")
        .populate("tue.exercise")
        .populate("wed.exercise")
        .populate("thu.exercise")
        .populate("fri.exercise")
        .populate("sat.exercise");
    }

    return {
      message: "Plan fetched successfully",
      success: true,
      data: savedPlan,
      pagination: paginationInfo,
    };
  } catch (error) {
    console.log(error.message);

    throw new Error(error);
  }
}
export async function updatePlan(planId: string, data: Record<string, any>) {
  try {
    console.log(planId);

    const planToBeUpdated = await WorkoutPlanModel.findOne({ _id: planId });
    console.log(planToBeUpdated);

    if (!planToBeUpdated) {
      return {
        message: "Plan with given id is not found",
        success: false,
      };
    }
    console.log("wen till here");

    // Only update the fields provided in `data`
    await WorkoutPlanModel.findByIdAndUpdate(planId, data, {
      new: true,
      runValidators: true,
    });

    // Fetch updated plan with population
    const updatedPlan = await WorkoutPlanModel.findById(planId)
      .populate("sun.exerciseId")
      .populate("mon.exerciseId")
      .populate("tue.exerciseId")
      .populate("wed.exerciseId")
      .populate("thu.exerciseId")
      .populate("fri.exerciseId")
      .populate("sat.exerciseId");

    return {
      message: "Plan updated successfully",
      success: true,
      data: updatedPlan,
    };
  } catch (error: any) {
    console.log(error.messsage);

    throw new Error(error.message || "Error updating plan");
  }
}
