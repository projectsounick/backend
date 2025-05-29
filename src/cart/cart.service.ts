import mongoose from "mongoose";
import PlanModel, { PlanItemModel } from "../Plans/plan.model";
import CartModel from "./cart.model";

export async function addCart(userId: string, data: Record<string, any>) {
  try {
    if (!data.planId && !data.productId) {
      return {
        message: "Either productId or planId is required",
        success: false,
      };
    }
    const cartObj:any = {
      userId:userId
    }
    if (data.productId) {
      cartObj['productId'] = data.productId;
    }

    if (data.planId) {
      const planToBeAdded = await PlanModel.findById(data.planId);
      if (!planToBeAdded) {
        return {
          message: "Plan with given id is not found",
          success: false,
        };
      }
      cartObj['planId'] = data.planId;

      if (data.planItemId) {
        const planItemToBeAdded = await PlanItemModel.findById(data.planItemId);
        if (!planItemToBeAdded) {
          return {
            message: "Plan item with given id is not found",
            success: false,
          };
        }
        if(planItemToBeAdded.planId.toString() !== data.planId) {
          return {
            message: "Plan item does not belong to the given plan",
            success: false,
          };
        }
        cartObj['planItemId'] = data.planItemId;
      }
    }
    const savedCart = await CartModel.create({ ...cartObj });
    return {
      message: "added successfully",
      success: true,
      data: savedCart,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getCart(userId: string, status: boolean | null) {
  try {
    const queryObj: any = { userId:new mongoose.Types.ObjectId(userId) };

    if (status !== null) {
      queryObj["isDeleted"] = status;
    }

    const cartItems = await CartModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      {
        $lookup: {
          from: "planitems",
          localField: "planItemId",
          foreignField: "_id",
          as: "planItemDetails",
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          quantity: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          productDetails: { $arrayElemAt: ["$productDetails", 0] },
          planDetails: { $arrayElemAt: ["$planDetails", 0] },
          planItemDetails: { $arrayElemAt: ["$planItemDetails", 0] },
        },
      },
    ]);

    return {
      message: "Cart items fetched successfully",
      success: true,
      data: cartItems,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateCartItem(
  cartItemId: string,
  action: "increment" | "decrement"
) {
  try {
    const cartItemToBeUpdated = await CartModel.findById(cartItemId);
    if (!cartItemToBeUpdated) {
      return {
        message: "cart item with given id is not found",
        success: false,
      };
    }
    if (action === "increment") {
      cartItemToBeUpdated.quantity += 1;
    } else if (action === "decrement") {
      if (cartItemToBeUpdated.quantity > 1) {
        cartItemToBeUpdated.quantity -= 1;
      } else {
        return {
          message: "Quantity cannot be less than 1",
          success: false,
        };
      }
    }
    const updatedCartItem = await cartItemToBeUpdated.save();

    return {
      message: "Cart Item updated successfully",
      success: true,
      data: updatedCartItem,
    };
  } catch (error) {
    throw new Error(error);
  }
}
