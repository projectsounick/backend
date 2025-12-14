import { UserDetailsModel } from "../users/user.model";
import CouponModel from "./coupon.model";
import mongoose from "mongoose";

/**
 * Fetch all coupons or specific ones by ID (excluding assignedUsers if filtered).
 * @param couponIds Optional array of coupon _id strings
 * @returns { success: boolean, message: string, data: any }
 */

/// Fetching the coupons ---------------------------------------------------------------/
export const fetchCoupons = async (userId) => {
  try {
    const coupons = await CouponModel.find({
      assignedUsers: userId
    }).select('-assignedUsers');

    return {
      success: true,
      message: "Filtered coupons fetched successfully",
      data: coupons,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Something went wrong while fetching coupons",
      data: null,
    };
  }
};

interface AddCouponInput {
  title: string;
  description: string;
  code: string;
  userIds: string[]; // Array of User _id as string
}

export const addCouponAndAssignToUsers = async (
  userId: string,
  input: AddCouponInput
) => {
  try {
    const { title, description, code, userIds } = input;

    // Create the new coupon
    const newCoupon = await CouponModel.create({
      title,
      createdBy: userId,
      description,
      code,
      assignedUsers: userIds.map((id) => new mongoose.Types.ObjectId(id)),
    });

    // Update userDetails for each userId
    await UserDetailsModel.updateMany(
      { userId: { $in: userIds } },
      { $addToSet: { assignedCoupons: newCoupon._id } } // $addToSet avoids duplicates
    );

    return {
      success: true,
      message: "Coupon created and assigned successfully",
      data: newCoupon,
    };
  } catch (error) {
    console.error("Error assigning coupon:", error);
    return {
      success: false,
      message: "Failed to assign coupon",
      error: error instanceof Error ? error.message : error,
    };
  }
};
