import UserMeasurementModel from "./measurementUnits.model";
import mongoose from "mongoose";

export const addOrUpdateUserMeasurement = async (
  userId: string,
  measurementData: {
    chest?: number;
    waist?: number;
    thigh?: number;
    armSizeLeft?: number;
    armSizeRight?: number;
  }
) => {
  try {
    const currentDate = new Date();

    const existing = await UserMeasurementModel.findOne({ userId });

    if (!existing) {
      const created = await UserMeasurementModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        measurementUnits: [
          {
            date: currentDate,
            ...measurementData,
          },
        ],
      });

      return {
        success: true,
        message: "Measurement record created successfully",
        data: created,
      };
    }

    existing.measurementUnits.push({
      date: currentDate,
      ...measurementData,
    });

    const updated = await existing.save();

    return {
      success: true,
      message: "New measurement entry added successfully",
      data: updated,
    };
  } catch (error) {
    console.error("Error in addOrUpdateUserMeasurement:", error);
    return {
      success: false,
      message: "Something went wrong while saving measurement",
      error,
    };
  }
};
export const getUserMeasurements = async (userId: string) => {
  try {
    const result = await UserMeasurementModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $addFields: {
          measurementUnits: {
            $sortArray: {
              input: "$measurementUnits",
              sortBy: { date: -1 }, // Descending (newest first)
            },
          },
        },
      },
    ]);

    if (!result || result.length === 0) {
      return {
        success: false,
        message: "No measurement record found for this user",
        data: null,
      };
    }

    return {
      success: true,
      message: "Measurements fetched successfully",
      data: result[0],
    };
  } catch (error) {
    console.error("Error in getUserMeasurements:", error);
    return {
      success: false,
      message: "Failed to fetch measurements",
      error,
    };
  }
};
