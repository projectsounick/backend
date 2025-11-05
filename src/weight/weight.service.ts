import mongoose from "mongoose";
import WeightTrackModel from "./weight.model";

export const addWeight = async (userId: string, data: any) => {
  try {
    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    const newEntry = new WeightTrackModel({
      userId: new mongoose.Types.ObjectId(userId),
      weight: data.weight,
      date: data.date || new Date(),
    });

    const saved = await newEntry.save();
    return { success: true, message: "Weight added successfully", data: saved };
  } catch (error: any) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
};

/**
 * 📦 Fetch all weight entries (for a user or all)
 */
export const getWeights = async (userId?: string) => {
  try {
    const query = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
    const entries = await WeightTrackModel.find(query).sort({ date: -1 });
    return {
      success: true,
      message: "Weights fetched successfully",
      data: entries,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * ❌ Delete a weight entry for a specific user
 */
export const deleteWeight = async (userId: string, weightId: string) => {
  try {
    if (!userId || !weightId) {
      return { success: false, message: "User ID and Weight ID are required" };
    }

    const deleted = await WeightTrackModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(weightId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!deleted) {
      return {
        success: false,
        message: "Weight entry not found or unauthorized",
      };
    }

    return {
      success: true,
      message: "Weight deleted successfully",
      data: deleted,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
