import { log } from "node:console";
import DiscountCouponModel, { DiscountCoupon } from "./discountCoupon.model";
import DiscountCouponUsageModel from "./discountCouponUsage.mode";
import mongoose from "mongoose";
interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

// Add a new discount
export const addDiscountCoupon = async (
  payload: Partial<DiscountCoupon>
): Promise<ServiceResponse<DiscountCoupon>> => {
  try {
    const discount = await DiscountCouponModel.create(payload);
    return {
      success: true,
      message: "Discount created successfully",
      data: discount,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create discount",
      error,
    };
  }
};

// Update an existing discount by ID
export const updateDiscountCoupon = async (
  id: string,
  updates: Partial<DiscountCoupon>
): Promise<ServiceResponse<DiscountCoupon>> => {
  try {
    console.log("se");

    console.log(id);
    console.log(updates);

    const discount = await DiscountCouponModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!discount) {
      return {
        success: false,
        message: "Discount not found",
      };
    }

    return {
      success: true,
      message: "Discount updated successfully",
      data: discount,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update discount",
      error,
    };
  }
};
export const getAllDiscountCoupons = async (): Promise<
  ServiceResponse<DiscountCoupon[]>
> => {
  try {
    const discounts = await DiscountCouponModel.find(); // Fetches all coupons

    return {
      success: true,
      message: "All discount coupons fetched successfully",
      data: discounts,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch discount coupons",
      error,
    };
  }
};


export const getDiscountCouponDetails = async (couponCode: string, userId: string): Promise<any> => {
  try {
    const couponDetails = await DiscountCouponModel.findOne({ code: couponCode }); // Fetches all coupons
    if (!couponDetails) {
      return {
        message: "Coupon details not found",
        success: false,
      };
    }
    const totalUsage = await DiscountCouponUsageModel.find({ couponCode: couponCode }).countDocuments();
    if (totalUsage >= couponDetails.totalUsage) {
      return {
        message: "Max redeem reached for this coupon",
        success: false,
      };
    }

    const userUsage = await DiscountCouponUsageModel.findOne({ couponCode: couponCode, userId: new mongoose.Types.ObjectId(userId) });
    console.log(userUsage)
    if (userUsage) {
      return {
        message: "You have already redeemed this coupon",
        success: false,
      };
    }

    return {
      success: true,
      message: "All discount coupons fetched successfully",
      data: couponDetails,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch discount coupons",
      error,
    };
  }
};


export const addUserUsage = async (couponCode: string, userId: string): Promise<any> => {
  try {
    const userUsage = await DiscountCouponUsageModel.create({ couponCode: couponCode, userId: new mongoose.Types.ObjectId(userId) });
    
    return {
      success: true,
      message: "User usage counted",
      data: userUsage,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch discount coupons",
      error,
    };
  }
};