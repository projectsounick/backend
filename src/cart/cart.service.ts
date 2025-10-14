import mongoose from "mongoose";
import PlanModel, { DietPlanModel, PlanItemModel } from "../Plans/plan.model";
import CartModel from "./cart.model";
import { addPaymentItem, addPaymentItemv2, getTransactionData } from "../payment/payment.service";
import ProductModel, { ProductVariationModel } from "../products/product.model";
import DiscountCouponModel from "../DiscountCoupon/discountCoupon.model";
import ServiceModel from "../services/services.model";

export async function addCart(userId: string, data: Record<string, any>) {
  try {
    console.log(data);

    if (!data.product && !data.dietPlanId && !data.plan && !data.serviceId) {
      return {
        message: "Either product, diet plan, plan, or serviceId is required",
        success: false,
      };
    }

    if (data.plan && (!data.plan.planId || !data.plan.planItemId)) {
      return {
        message: "Plan details must include planId and planItemId",
        success: false,
      };
    }

    if (
      data.product &&
      (!data.product.productId || !data.product.variationId)
    ) {
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

      const productToBeAdded = await ProductModel.findById(
        productObj.productId
      );
      if (!productToBeAdded) {
        return {
          message: "Product with given id is not found",
          success: false,
        };
      }
      cartObj.product["productId"] = productToBeAdded._id;
      console.log("went pass this");

      const variationToBeAdded = await ProductVariationModel.findById(
        productObj.variationId
      );
      if (!variationToBeAdded) {
        return {
          message: "Variation with given id is not found",
          success: false,
        };
      }
      console.log("here");

      if (
        variationToBeAdded.productId.toString() !==
        productToBeAdded._id.toString()
      ) {
        return {
          message: "Variation item does not belong to the given product",
          success: false,
        };
      }
      console.log("got here");

      cartObj.product["variationId"] = variationToBeAdded._id;
      console.log(cartObj);
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
    } else if (data.serviceId) {
      const serviceToBeAdded = await ServiceModel.findById(data.serviceId);
      if (!serviceToBeAdded) {
        return {
          message: "Service with given id is not found",
          success: false,
        };
      }
      cartObj["serviceId"] = new mongoose.Types.ObjectId(data.serviceId);
    }
    console.log(cartObj);

    const savedCart = await CartModel.create({ ...cartObj });
    return {
      message: "Item added to cart successfully",
      success: true,
      data: savedCart,
    };
  } catch (error) {
    console.log(error.message);

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
      // Lookup service details (if applicable)
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceDetails",
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
          product: 1,
          serviceDetails: { $arrayElemAt: ["$serviceDetails", 0] },
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
      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: "$dietPlanId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$dietPlanId"] },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                imgUrl: 1,
                duration: 1,
                durationType: 1,
              },
            },
          ],
          as: "dietPlanDetails",
        },
      },
      // Lookup service details (if applicable)
      {
        $lookup: {
          from: "services",
          let: { serviceId: "$serviceId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$serviceId"] },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                imgUrl: 1
              },
            },
          ],
          as: "serviceDetails",
        },
      },

      // Lookup plan details
      {
        $lookup: {
          from: "plans",
          let: { planId: "$plan.planId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$planId"] } } },
            {
              $project: { _id: 1, title: 1, imgUrl: 1, dietPlanId: 1 },
            },
          ],
          as: "planDetails",
        },
      },

      // Lookup plan item details
      {
        $lookup: {
          from: "planitems",
          let: { planItemId: "$plan.planItemId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$planItemId"] } } },
            {
              $project: {
                _id: 1,
                price: 1,
                duration: 1,
                durationType: 1,
                sessionCount: 1,
              },
            },
          ],
          as: "planItemDetails",
        },
      },

      // Lookup diet plan from planDetails.dietPlanId
      {
        $lookup: {
          from: "dietplans",
          let: { dietPlanId: { $arrayElemAt: ["$planDetails.dietPlanId", 0] } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } },
            {
              $project: {
                _id: 1,
                title: 1,
                imgUrl: 1,
                duration: 1,
                durationType: 1,
              },
            },
          ],
          as: "planDietPlanDetails",
        },
      },

      // Merge plan details, planItem, and dietPlanDetails
      {
        $addFields: {
          plan: {
            $cond: {
              if: { $gt: [{ $size: "$planDetails" }, 0] },
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$planDetails", 0] },
                  {
                    planItem: { $arrayElemAt: ["$planItemDetails", 0] },
                    dietPlanDetails: {
                      $arrayElemAt: ["$planDietPlanDetails", 0],
                    },
                  },
                ],
              },
              else: "$$REMOVE",
            },
          },
        },
      },

      // Lookup product
      {
        $lookup: {
          from: "products",
          let: { productId: "$product.productId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
            {
              $project: { _id: 1, name: 1, images: 1, basePrice: 1 },
            },
          ],
          as: "productDetails",
        },
      },

      // Lookup product variation
      {
        $lookup: {
          from: "productvariations",
          let: { variationId: "$product.variationId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$variationId"] } } },
            {
              $project: { _id: 1, label: 1, price: 1 },
            },
          ],
          as: "variationDetails",
        },
      },

      // Merge product and variation
      {
        $addFields: {
          product: {
            $cond: {
              if: { $gt: [{ $size: "$productDetails" }, 0] },
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$productDetails", 0] },
                  {
                    variation: { $arrayElemAt: ["$variationDetails", 0] },
                  },
                ],
              },
              else: "$$REMOVE",
            },
          },
        },
      },

      // Final projection
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
          plan: 1,
          product: 1,
          serviceDetails: { $arrayElemAt: ["$serviceDetails", 0] },
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
    console.log(cartItemId);
    console.log(action);

    const cartItemToBeUpdated = await CartModel.findById(cartItemId);
    console.log(cartItemToBeUpdated);

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
    console.log("this is cartitems to saved");
    console.log(cartItemToBeUpdated);

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

export async function cartCheckout(
  userId: string,
  couponCode: string,
  deliveryAddess: string
) {
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

      // Lookup service details (if applicable)
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceDetails",
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
          product: 1,
          serviceDetails: { $arrayElemAt: ["$serviceDetails", 0] },
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
      } else if (item.serviceDetails) {
        totalAmount += item.serviceDetails.price * item.quantity;
      }else {
        totalAmount += item.plan.planItem.price * item.quantity;
      }
      cartItemsId.push(item._id);
    });
    console.log(totalAmount);
    console.log(cartItemsId);
    console.log(couponDetails);

    if (couponDetails) {
      totalAmount = Math.max(totalAmount - couponDetails.discountPrice, 0);
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
      couponDetails ? couponDetails.code : "",
      deliveryAddess ? deliveryAddess : ""
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

export async function cartCheckoutv2(
  userId: string,
  couponCode: string,
  deliveryAddess: string
) {
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

      // Lookup service details (if applicable)
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceDetails",
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
          product: 1,
          serviceDetails: { $arrayElemAt: ["$serviceDetails", 0] },
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
      } else if (item.serviceDetails) {
        totalAmount += item.serviceDetails.price * item.quantity;
      }else {
        totalAmount += item.plan.planItem.price * item.quantity;
      }
      cartItemsId.push(item._id);
    });
    console.log(totalAmount);
    console.log(cartItemsId);
    console.log(couponDetails);

    if (couponDetails) {
      totalAmount = Math.max(totalAmount - couponDetails.discountPrice, 0);
    }

    // const paymentResponse = await getTransactionData(
    //   userId,
    //   totalAmount,
    //   phoneNumber,
    //   cartItemsId
    // );
    const paymentResponse = await addPaymentItemv2(
      userId,
      totalAmount,
      cartItemsId,
      couponDetails ? couponDetails.code : "",
      deliveryAddess ? deliveryAddess : ""
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