import mongoose from "mongoose";
import PlanModel, { DietPlanModel, PlanItemModel } from "../Plans/plan.model";
import CartModel from "./cart.model";
import { addPaymentItem, getTransactionData } from "../payment/payment.service";
import ProductModel, { ProductVariationModel } from "../products/product.model";
import DiscountCouponModel from "../DiscountCoupon/discountCoupon.model";

export async function addCart(userId: string, data: Record<string, any>) {
  try {
    console.log(data);

    if (!data.product && !data.dietPlanId && !data.plan) {
      return {
        message: "Either product details, diet plan id or plan detail is required",
        success: false,
      };
    }

    if (data.plan && (!data.plan.planId || !data.plan.planItemId)) {
      return {
        message: "Plan details must include planId and planItemId",
        success: false,
      };
    }

    if (data.product && (!data.product.productId || !data.product.variationId)) {
      return {
        message: "Product details must include productId and variationId",
        success: false,
      };
    }

    const cartObj: any = {
      userId: userId,
    };
    if (data.product) {
      const productObj = data.product;
      cartObj["product"] = {};

      const productToBeAdded = await ProductModel.findById(productObj.productId);
      if (!productToBeAdded) {
        return {
          message: "Product with given id is not found",
          success: false,
        };
      }
      cartObj.product["productId"] = productToBeAdded._id;

      const variationToBeAdded = await ProductVariationModel.findById(
        productObj.variationId
      );
      if (!variationToBeAdded) {
        return {
          message: "Variation with given id is not found",
          success: false,
        };
      }

      if (
        variationToBeAdded.productId.toString() !== productToBeAdded._id.toString()
      ) {
        return {
          message: "Variation item does not belong to the given product",
          success: false,
        };
      }
      cartObj.product["variationId"] = variationToBeAdded._id;
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

      //Lookup product details using the nested `product.productId`
      {
        $lookup: {
          from: "products",
          let: { productId: "$product.productId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }],
          as: "productDetails",
        },
      },

      //Lookup variation item details using the nested `product.variationId`
      {
        $lookup: {
          from: "productvariations",
          let: { variationId: "$product.variationId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$variationId"] } } }],
          as: "variationDetails",
        },
      },
      // Convert `productDetails`, and `variationDetails` into a structured product object
      {
        $addFields: {
          product: {
            $cond: {
              if: { $gt: [{ $size: "$productDetails" }, 0] }, // Only add if product exists
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$productDetails", 0] }, // Extract product object
                  {
                    variation: { $arrayElemAt: ["$variationDetails", 0] }, //  Nest variation inside plan
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove product if no data exists
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
          dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] },
          plan: 1, //Plan object will appear only if data exists
          product: 1
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
export async function getCartUser(userId: string, status: boolean | null) {
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

      // Lookup diet plan details (if applicable)
      // {
      //   $lookup: {
      //     from: "dietplans",
      //     localField: "dietPlanId",
      //     foreignField: "_id",
      //     as: "dietPlanDetails",
      //   },
      // },

      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: "$dietPlanId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$dietPlanId"] }
              }
            },
            {
              $project: { _id: 1,title: 1, imgUrl: 1, duration: 1, durationType:1 } // Only required fields
            }
          ],
          as: "dietPlanDetails"
        }
      },

      //Lookup plan details using the nested `plan.planId`
      {
        $lookup: {
          from: "plans",
          let: { planId: "$plan.planId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$planId"] } } },
            {
              $project: { _id: 1,title: 1, imgUrl: 1, dietPlanId: 1 } // Only required fields
            }
          ],
          as: "planDetails",
        },
      },

      //Lookup plan item details using the nested `plan.planItemId`
      {
        $lookup: {
          from: "planitems",
          let: { planItemId: "$plan.planItemId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$planItemId"] } } },
            {
              $project: { _id: 1,price: 1, duration: 1, durationType: 1, sessionCount:1 } // Only required fields
            }
          ],
          as: "planItemDetails",
        },
      },
      // Lookup diet plan details from `planDetails.dietPlanId`
      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: { $first: ["$planDetails.dietPlanId", 0] } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } },
            {
              $project: { _id: 1,title: 1, imgUrl: 1, duration: 1, durationType:1 } // Only required fields
            }
          ],
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
                  { $first: ["$planDetails", 0] }, // Extract plan object
                  {
                    planItem: { $first: ["$planItemDetails", 0] }, //  Nest planItem inside plan
                    dietPlanDetails: {
                      $first: ["$planDietPlanDetails", 0],
                    }, //  Nest dietPlanDetails inside plan
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove plan if no data exists
            },
          },
        },
      },

      //Lookup product details using the nested `product.productId`
      {
        $lookup: {
          from: "products",
          let: { productId: "$product.productId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
            {
              $project: { _id: 1,name: 1, images: 1, basePrice: 1 } // Only required fields
            }
          ],
          as: "productDetails",
        },
      },

      //Lookup variation item details using the nested `product.variationId`
      {
        $lookup: {
          from: "productvariations",
          let: { variationId: "$product.variationId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$variationId"] } } },
            {
              $project: { _id: 1,label: 1, price: 1 } // Only required fields
            }
          ],
          as: "variationDetails",
        },
      },
      // Convert `productDetails`, and `variationDetails` into a structured product object
      {
        $addFields: {
          product: {
            $cond: {
              if: { $gt: [{ $size: "$productDetails" }, 0] }, // Only add if product exists
              then: {
                $mergeObjects: [
                  { $first: ["$productDetails", 0] }, // Extract product object
                  {
                    variation: { $first: ["$variationDetails", 0] }, //  Nest variation inside plan
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove product if no data exists
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
          dietPlanDetails: { $first: ["$dietPlanDetails", 0] },
          plan: 1, //Plan object will appear only if data exists
          product: 1
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

export async function cartCheckout(userId: string, couponCode: string, deliveryAddess:string) {
  try {
    let couponDetails = null;
    if (couponCode) {
      couponDetails = await DiscountCouponModel.findOne({ code: couponCode });
      if (!couponDetails) {
        return {
          message: "Coupon details not found",
          success: false,
        };
      }
    }
    const queryObj: any = {
      userId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    };

    const cartItems = await CartModel.aggregate([
      { $match: queryObj },
      { $sort: { createdAt: -1 } },

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

      //Lookup product details using the nested `product.productId`
      {
        $lookup: {
          from: "products",
          let: { productId: "$product.productId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }],
          as: "productDetails",
        },
      },

      //Lookup variation item details using the nested `product.variationId`
      {
        $lookup: {
          from: "productvariations",
          let: { variationId: "$product.variationId" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$variationId"] } } }],
          as: "variationDetails",
        },
      },
      // Convert `productDetails`, and `variationDetails` into a structured product object
      {
        $addFields: {
          product: {
            $cond: {
              if: { $gt: [{ $size: "$productDetails" }, 0] }, // Only add if product exists
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$productDetails", 0] }, // Extract product object
                  {
                    variation: { $arrayElemAt: ["$variationDetails", 0] }, //  Nest variation inside plan
                  },
                ],
              },
              else: "$$REMOVE", //  Completely remove product if no data exists
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
          dietPlanDetails: { $arrayElemAt: ["$dietPlanDetails", 0] },
          plan: 1, //Plan object will appear only if data exists
          product: 1
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
      if (item.product) {
        if (item.product.variation) {
          totalAmount += item.product.variation.price * item.quantity;
        } else {
          totalAmount += item.product.basePrice * item.quantity;
        }
      } else if (item.dietPlanDetails) {
        totalAmount += item.dietPlanDetails.price * item.quantity;
      } else {
        totalAmount += item.plan.planItem.price * item.quantity;
      }
      cartItemsId.push(item._id);
    });
    console.log(totalAmount);
    console.log(cartItemsId);
    console.log(couponDetails);


    if(couponDetails){
      totalAmount = Math.max((totalAmount-couponDetails.discountPrice),0)
    }

    // const paymentResponse = await getTransactionData(
    //   userId,
    //   totalAmount,
    //   phoneNumber,
    //   cartItemsId
    // );
    const paymentResponse = await addPaymentItem(
      userId,
      totalAmount,
      cartItemsId,
      couponDetails ? couponDetails.code : '',
      deliveryAddess ? deliveryAddess : ''
    );
    if (paymentResponse.success) {
      return paymentResponse;
    } else
      return {
        success: false,
        message: "Some error has happened",
      };

    // // Mark all cart items as deleted
    // await CartModel.updateMany(
    //   { _id: { $in: cartItemsId } },
    //   { $set: { isDeleted: true, isBought: true } }
    // );
  } catch (error) {
    throw new Error(error);
  }
}
