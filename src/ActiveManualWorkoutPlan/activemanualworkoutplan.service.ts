import { ActiveManualWorkoutPlanModel } from "./activemanualworkoutplan.model";

export async function createActiveManualWorkoutPlan(data: Record<string, any>) {
  try {
    // Step 1: Create the document
    console.log(data);
    if (data.endDate) {
      const raw = new Date(data.endDate);
      raw.setHours(0, 0, 0, 0); // local midnight
      data.endDate = raw;
    }

    // Optional: Set startDate to now if not provided
    if (!data.startDate) {
      data.startDate = new Date();
    }

    // Create the plan
    const newPlan = await ActiveManualWorkoutPlanModel.create(data);

    // Step 2: Populate fields, restricting userId and assignerId to only _id
    const populatedPlan = await ActiveManualWorkoutPlanModel.findById(
      newPlan._id
    )
      .populate("userId", "_id")
      .populate("assignerId", "_id")
      .populate({
        path: "workoutPlanId",
        populate: [
          { path: "sun.exercise" },
          { path: "mon.exercise" },
          { path: "tue.exercise" },
          { path: "wed.exercise" },
          { path: "thu.exercise" },
          { path: "fri.exercise" },
          { path: "sat.exercise" },
        ],
      });
    console.log(populatedPlan);

    return {
      message: "Active manual workout plan created successfully",
      success: true,
      data: populatedPlan,
    };
  } catch (error) {
    console.log(error.message);

    throw new Error(
      "Failed to create and populate active manual workout plan: " + error
    );
  }
}
export async function getActiveManualWorkoutPlans(
  queryObj: Record<string, any> = {}
) {
  try {
    const finalQuery: Record<string, any> = { ...queryObj };

    // Only filter by isActive if it is explicitly true
    if (queryObj.hasOwnProperty("isActive") && queryObj.isActive === true) {
      finalQuery.isActive = true;
    } else {
      delete finalQuery.isActive; // fetch all if not explicitly true
    }
    const plans = await ActiveManualWorkoutPlanModel.find(finalQuery)
      .populate("userId", "_id")
      .populate("assignerId", "_id")
      .populate({
        path: "workoutPlanId",
        populate: [
          { path: "sun.exercise" },
          { path: "mon.exercise" },
          { path: "tue.exercise" },
          { path: "wed.exercise" },
          { path: "thu.exercise" },
          { path: "fri.exercise" },
          { path: "sat.exercise" },
        ],
      });
    return {
      message: "Active manual workout plans fetched successfully",
      success: true,
      data: plans,
    };
  } catch (error) {
    console.log(error.message);

    throw new Error("Failed to fetch active manual workout plans: " + error);
  }
}

export async function updateActiveManualWorkoutPlan(
  planId: string,
  data: Record<string, any>
) {
  try {
    const planToUpdate = await ActiveManualWorkoutPlanModel.findById(planId);
    if (!planToUpdate) {
      return {
        message: "Workout plan with given id is not found",
        success: false,
      };
    }
    if (data?.endDate) {
      const parsedEndDate = new Date(data.endDate);
      parsedEndDate.setHours(0, 0, 0, 0);
      data.endDate = parsedEndDate;
    }
    // Update the plan
    await ActiveManualWorkoutPlanModel.findByIdAndUpdate(planId, data, {
      new: true,
      runValidators: true,
    });

    // Re-fetch with population
    const updatedPlan = await ActiveManualWorkoutPlanModel.findById(planId)
      .populate({
        path: "workoutPlanId",
        populate: [
          { path: "sun.exercise" },
          { path: "mon.exercise" },
          { path: "tue.exercise" },
          { path: "wed.exercise" },
          { path: "thu.exercise" },
          { path: "fri.exercise" },
          { path: "sat.exercise" },
        ],
      })
      .populate("userId")
      .populate("assignerId");

    return {
      message: "Active manual workout plan updated successfully",
      success: true,
      data: updatedPlan,
    };
  } catch (error: any) {
    throw new Error(
      "Failed to update active manual workout plan: " + error.message
    );
  }
}
