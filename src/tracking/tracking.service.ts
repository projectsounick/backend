import mongoose from "mongoose";
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
export async function getDayTrackingData(userId: string, day: string) {
  try {
    if (!userId || !day) {
      return {
        success: false,
        message: "Missing required fields.",
        data: null,
      };
    }

    console.log("this is day:", day);

    const start = new Date(day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    console.log("Start:", start);
    console.log("End:", end);

    const [sleepData, stepsData, waterData] = await Promise.all([
      SleepTrackingModel.findOne({
        userId,
        date: { $gte: start, $lte: end },
      }),
      WalkTrackingModel.findOne({
        userId,
        date: { $gte: start, $lte: end },
      }),
      WaterTrackingModel.findOne({
        userId,
        date: { $gte: start, $lte: end },
      }),
    ]);

    return {
      success: true,
      message: "Fetched successfully!",
      data: {
        sleep: sleepData || {},
        steps: stepsData || {},
        water: waterData || {},
      },
    };
  } catch (error) {
    console.error("Error fetching day tracking data:", error);
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




interface TrackingPayload {
  steps?: Array<{ userId: string; steps: number; date: string }>;
  water?: Array<{ userId: string; waterIntake: number; date: string }>;
  sleep?: Array<{ userId: string; sleepDuration: number; date: string }>;
}
export async function addUserTracking(data: TrackingPayload) {
  try {
    const results: any = {};

    // Upsert steps (WalkTracking) - update if exists, insert if not
    if (data.steps && data.steps.length > 0) {
      const stepPromises = data.steps.map(async (item) => {
        const normalizedDate = new Date(item.date).toLocaleDateString("en-CA");
        return await WalkTrackingModel.findOneAndUpdate(
          {
            userId: new mongoose.Types.ObjectId(item.userId),
            date: normalizedDate,
          },
          {
            userId: new mongoose.Types.ObjectId(item.userId),
            steps: item.steps,
            date: normalizedDate,
          },
          {
            upsert: true,
            new: true,
          }
        );
      });
      results.steps = await Promise.all(stepPromises);
    }

    // Upsert water intake (WaterTracking)
    if (data.water && data.water.length > 0) {
      const waterPromises = data.water.map(async (item) => {
        return await WaterTrackingModel.findOneAndUpdate(
          {
            userId: new mongoose.Types.ObjectId(item.userId),
            date: new Date(item.date),
          },
          {
            userId: new mongoose.Types.ObjectId(item.userId),
            waterIntake: item.waterIntake,
            date: new Date(item.date),
          },
          {
            upsert: true,
            new: true,
          }
        );
      });
      results.water = await Promise.all(waterPromises);
    }

    // Upsert sleep duration (SleepTracking)
    if (data.sleep && data.sleep.length > 0) {
      const sleepPromises = data.sleep.map(async (item) => {
        return await SleepTrackingModel.findOneAndUpdate(
          {
            userId: new mongoose.Types.ObjectId(item.userId),
            date: new Date(item.date),
          },
          {
            userId: new mongoose.Types.ObjectId(item.userId),
            sleepDuration: item.sleepDuration,
            date: new Date(item.date),
          },
          {
            upsert: true,
            new: true,
          }
        );
      });
      results.sleep = await Promise.all(sleepPromises);
    }

    return {
      success: true,
      message: "Tracking data synced successfully",
      data: results,
    };
  } catch (error: any) {
    console.error(error);
    return {
      success: false,
      message: "Failed to sync tracking data",
      error: error.message,
    };
  }
}