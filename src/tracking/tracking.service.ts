import SleepTrackingModel from "./sleepTracking.model";
import WalkTrackingModel from "./walkTracking.model";
import WaterTrackingModel from "./waterTracking.model";

//// Sleep Tracking ////
export async function AddOrUpdateSleepTracking(
  userId: string,
  value: number,
  date: string
) {
  try {
    if (!userId || !value || !date) {
      return {
        success: false,
        message: "Missing required fields.",
        data: null,
      };
    }

    const existingEntry = await SleepTrackingModel.findOne({
      userId,
      date: new Date(date),
    });
    if (existingEntry) {
      // ✅ If entry exists, update it
      existingEntry.sleepDuration = value;
      await existingEntry.save();
      return {
        success: true,
        message: "Updated successfully!",
        data: existingEntry,
      };
    } else {
      // ✅ Otherwise, create a new entry
      const newEntry = new SleepTrackingModel({
        userId: userId,
        sleepDuration: value,
        date: new Date(date),
      });
      const savedEntry = await newEntry.save();
      return {
        success: true,
        message: "Updated successfully!",
        data: savedEntry,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Internal server error.",
      data: null,
    };
  }
}
export async function getSleepTracking(
  userId: string,
  startDate: string,
  endDate: string
) {
  try {
    if (!userId || !startDate || !endDate) {
      return {
        success: false,
        message: "Missing required fields.",
        data: null,
      };
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log(userId);
    console.log(startDate);
    console.log(endDate);

    const savedData = await SleepTrackingModel.find({
      userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    return {
      success: true,
      message: "Fetched successfully!",
      data: savedData,
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

//// Walk Tracking ////
export async function AddOrUpdateWalkTracking(
  userId: string,
  value: number,
  date: string
) {
  try {
    if (!userId || !value || !date) {
      return {
        success: false,
        message: "Missing required fields.",
        data: null,
      };
    }
    // ✅ Normalize the date to local midnight
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0); // start of the day in local time

    // ✅ Use ISO format or your DB format (e.g., YYYY-MM-DD)
    const normalizedDate = localDate.toLocaleDateString("en-CA"); // "2025-05-18"

    const existingEntry = await WalkTrackingModel.findOne({
      userId,
      date: normalizedDate,
    });
    if (existingEntry) {
      // ✅ If entry exists, update it
      existingEntry.steps = value;
      await existingEntry.save();
      return {
        success: true,
        message: "Updated successfully!",
        data: existingEntry,
      };
    } else {
      // ✅ Otherwise, create a new entry
      const newEntry = new WalkTrackingModel({
        userId: userId,
        steps: value,
        date: normalizedDate,
      });
      const savedEntry = await newEntry.save();
      return {
        success: true,
        message: "Updated successfully!",
        data: savedEntry,
      };
    }
  } catch (error) {
    console.log("Error in AddOrUpdateWalkTracking:", error);
    return {
      success: false,
      message: "Internal server error.",
      data: null,
    };
  }
}
export async function getWalkTracking(
  userId: string,
  startDate: string,
  endDate: string
) {
  try {
    if (!userId || !startDate || !endDate) {
      return {
        success: false,
        message: "Missing required fields.",
        data: null,
      };
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const savedData = await WalkTrackingModel.find({
      userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    return {
      success: true,
      message: "Fetched successfully!",
      data: savedData,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error.",
      data: null,
    };
  }
}

//// Water Tracking ////
export async function AddOrUpdateWaterTracking(
  userId: string,
  value: number,
  date: string
) {
  try {
    if (!userId || !value || !date) {
      return {
        success: false,
        message: "Missing required fields.",
        data: null,
      };
    }
    const existingEntry = await WaterTrackingModel.findOne({
      userId,
      date: new Date(date),
    });
    if (existingEntry) {
      // ✅ If entry exists, update it
      existingEntry.waterIntake = value;
      await existingEntry.save();
      return {
        success: true,
        message: "Updated successfully!",
        data: existingEntry,
      };
    } else {
      // ✅ Otherwise, create a new entry
      const newEntry = new WaterTrackingModel({
        userId: userId,
        waterIntake: value,
        date: new Date(date),
      });
      const savedEntry = await newEntry.save();
      return {
        success: true,
        message: "Updated successfully!",
        data: savedEntry,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Internal server error.",
      data: null,
    };
  }
}
export async function getWaterTracking(
  userId: string,
  startDate: string,
  endDate: string
) {
  try {
    if (!userId || !startDate || !endDate) {
      return {
        success: false,
        message: "Missing required fields.",
        data: null,
      };
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const savedData = await WaterTrackingModel.find({
      userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    return {
      success: true,
      message: "Fetched successfully!",
      data: savedData,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error.",
      data: null,
    };
  }
}
