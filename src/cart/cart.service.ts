import mongoose from "mongoose";
import PlanModel, { DietPlanModel, PlanItemModel } from "../Plans/plan.model";
import CartModel from "./cart.model";
import { addPaymentItem } from "../payment/payment.service";

export async function addCart(userId: string, data: Record<string, any>) {
  try {
    if (!data.productId && !data.dietPlanId && !data.plan) {
      return {
        message: "Either product id, diet plan id or plan detail is required",
        success: false,
      };
    }

    if (data.plan && (!data.plan.planId || !data.plan.planItemId)) {
      return {
        message: "Plan details must include planId and planItemId",
        success: false,
      };
    }
    const cartObj: any = {
      userId: userId,
    };
    if (data.productId) {
      cartObj["productId"] = new mongoose.Types.ObjectId(data.productId);
    } else if (data.dietPlanId) {
      const dietPlanToBeAdded = await DietPlanModel.findById(data.dietPlanId);
      if (!dietPlanToBeAdded) {
        return {
          message: "Diet plan with given id is not found",
          success: false,
        };
      }
      cartObj["dietPlanId"] = dietPlanToBeAdded._id;
    } else if (data.plan) {
      const planObj = data.plan;
      cartObj["plan"] = {};

      const planToBeAdded = await PlanModel.findById(planObj.planId);
      if (!planToBeAdded) {
        return {
          message: "Plan with given id is not found",
          success: false,
        };
      }
      cartObj.plan["planId"] = planToBeAdded._id;

      const planItemToBeAdded = await PlanItemModel.findById(
        planObj.planItemId
      );
      if (!planItemToBeAdded) {
        return {
          message: "Plan item with given id is not found",
          success: false,
        };
      }

      if (
        planItemToBeAdded.planId.toString() !== planToBeAdded._id.toString()
      ) {
        return {
          message: "Plan item does not belong to the given plan",
          success: false,
        };
      }
      cartObj.plan["planItemId"] = planItemToBeAdded._id;
    }
    const savedCart = await CartModel.create({ ...cartObj });
    return {
      message: "Item added to cart successfully",
      success: true,
      data: savedCart,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getCart(userId: string, status: boolean | null) {
  try {
    const queryObj: any = {};

    // Only filter by userId if it's provided
    if (userId) {
      queryObj.userId = new mongoose.Types.ObjectId(userId);
    }
    if (status !== null) {
      queryObj["isDeleted"] = status;
    }

    const cartItems = await CartModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },

      //Lookup product details
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      // Lookup diet plan details (if applicable)
      {
        $lookup: {
          from: "dietplans",
          localField: "dietPlanId",
          foreignField: "_id",
          as: "dietPlanDetails",
        },
      },

      //Lookup plan details using the nested `plan.planId`
      {
        $lookup: {
          from: "plans",
          let: { planId: "$plan.planId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planId"] } } }],
          as: "planDetails",
        },
      },

      //Lookup plan item details using the nested `plan.planItemId`
      {
        $lookup: {
          from: "planitems",
          let: { planItemId: "$plan.planItemId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planItemId"] } } }],
          as: "planItemDetails",
        },
      },
      // Lookup diet plan details from `planDetails.dietPlanId`
      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: { $arrayElemAt: ["$planDetails.dietPlanId", 0] } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } }],
          as: "planDietPlanDetails",
        },
      },

      // Convert `planDetails`, `planItemDetails`, and `planDietPlanDetails` into a structured plan object
      {
        $addFields: {
          plan: {
            $cond: {
              if: { $gt: [{ $size: "$planDetails" }, 0] }, // Only add if plan exists
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$planDetails", 0] }, // Extract plan object
                  {
                    planItem: { $arrayElemAt: ["$planItemDetails", 0] }, //  Nest planItem inside plan
                    dietPlanDetails: {
                      $arrayElemAt: ["$planDietPlanDetails", 0],
                    }, //  Nest dietPlanDetails inside plan
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove plan if no data exists
            },
          },
        },
      },

      //Ensure final structure
      {
        $project: {
          _id: 1,
          userId: 1,
          quantity: 1,
          isDeleted: 1,
          isBought: 1,
          createdAt: 1,
          updatedAt: 1,
          productDetails: { $arrayElemAt: ["$productDetails", 0] },
          dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] },
          plan: 1, //Plan object will appear only if data exists
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

//// Function for deleting from the cart items ----------------------------/
export const deleteCartItem = async (cartItemId: string) => {
  try {
    const response = await CartModel.findOneAndUpdate(
      { _id: cartItemId },
      { $set: { isDeleted: true } }
    );
    if (response) {
      return {
        success: true,
        message: "Cart item marked as deleted",
      };
    } else {
      return {
        success: false,
        message: "No changes made (item not found or already deleted)",
      };
    }
  } catch (error) {
    throw new Error(error);
  }
};

export async function cartCheckout(userId: string) {
  try {
    const queryObj: any = {
      userId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    };

    const cartItems = await CartModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },

      //Lookup product details
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      // Lookup diet plan details (if applicable)
      {
        $lookup: {
          from: "dietplans",
          localField: "dietPlanId",
          foreignField: "_id",
          as: "dietPlanDetails",
        },
      },

      //Lookup plan details using the nested `plan.planId`
      {
        $lookup: {
          from: "plans",
          let: { planId: "$plan.planId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planId"] } } }],
          as: "planDetails",
        },
      },

      //Lookup plan item details using the nested `plan.planItemId`
      {
        $lookup: {
          from: "planitems",
          let: { planItemId: "$plan.planItemId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$planItemId"] } } }],
          as: "planItemDetails",
        },
      },
      // Lookup diet plan details from `planDetails.dietPlanId`
      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: { $arrayElemAt: ["$planDetails.dietPlanId", 0] } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } }],
          as: "planDietPlanDetails",
        },
      },

      // Convert `planDetails`, `planItemDetails`, and `planDietPlanDetails` into a structured plan object
      {
        $addFields: {
          plan: {
            $cond: {
              if: { $gt: [{ $size: "$planDetails" }, 0] }, // Only add if plan exists
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$planDetails", 0] }, // Extract plan object
                  {
                    planItem: { $arrayElemAt: ["$planItemDetails", 0] }, //  Nest planItem inside plan
                    dietPlanDetails: {
                      $arrayElemAt: ["$planDietPlanDetails", 0],
                    }, //  Nest dietPlanDetails inside plan
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove plan if no data exists
            },
          },
        },
      },

      //Ensure final structure
      {
        $project: {
          _id: 1,
          userId: 1,
          quantity: 1,
          isDeleted: 1,
          isBought: 1,
          createdAt: 1,
          updatedAt: 1,
          productDetails: { $arrayElemAt: ["$productDetails", 0] },
          dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] },
          plan: 1, //Plan object will appear only if data exists
        },
      },
    ]);

    if (cartItems.length === 0) {
      return {
        message: "No items in the cart",
        success: false,
      };
    }

    let totalAmount = 0;
    const cartItemsId = [];

    cartItems.forEach((item: any) => {
      if (item.productDetails) {
        totalAmount += item.productDetails.price * item.quantity;
      } else if (item.dietPlanDetails) {
        totalAmount += item.dietPlanDetails.price * item.quantity;
      } else {
        totalAmount += item.plan.planItem.price * item.quantity;
      }
      cartItemsId.push(item._id);
    });

    // Mark all cart items as deleted
    await CartModel.updateMany(
      { _id: { $in: cartItemsId } },
      { $set: { isDeleted: true, isBought: true } }
    );

    const paymentResponse = await addPaymentItem(userId, totalAmount, false, {
      items: cartItemsId,
    });
    if (!paymentResponse.success) {
      return {
        message: paymentResponse.message,
        success: false,
      };
    }
    return {
      message: "Items Ordered successfully",
      success: true,
      data: {
        payment: paymentResponse.data,
        cartItems: cartItems,
      },
    };
  } catch (error) {
    throw new Error(error);
  }
}
