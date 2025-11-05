import mongoose from "mongoose";
import PaymentModel from "./payment.model";
import {
  activePlanForUser,
  activeServiceUser,
} from "../userActivePlans/activePlans.service";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import CartModel from "../cart/cart.model";
import { generateReceiptPdf } from "./ReciptUtils";
import { uploadUserReceiptPdfWithSas } from "../azure/azureService";
import crypto from "crypto";
import { addUserUsage } from "../DiscountCoupon/discoutCoupon.service";
import { ObjectId } from "bson";
export async function addPaymentItem(
  userId: string,
  amount: number,
  items: Array<string>,
  couponCode: string,
  deliveryAddess: string
) {
  try {
    if (items.length === 0) {
      return {
        message: "items cannot be empty",
        success: false,
      };
    }
    const orderId = uuidv4();
    console.log(orderId);
    const orderObj = await createOrder(amount, orderId);
    // const redirectUrl = await initiatePayment(amount, orderId);

    // const paymentObj: any = {
    //   userId: new mongoose.Types.ObjectId(userId),
    //   amount: amount,
    //   status: "pending",
    //   items: items,
    //   orderId: orderId,
    //   paymentUrl: redirectUrl,
    // };
    // if (couponCode) {
    //   paymentObj["couponCode"] = couponCode;
    // }
    // if (deliveryAddess) {
    //   paymentObj["deliveryAddess"] = deliveryAddess;
    // }
    // const savedPaymentItem = await PaymentModel.create({ ...paymentObj });
    return {
      message: "added successfully",
      success: true,
      // data: savedPaymentItem,
      orderId: orderObj.orderId,
      orderToken: orderObj.token,
    };
  } catch (error) {
    throw new Error(error);
  }
}
async function getAuthToken() {
  try {
    const formData = new URLSearchParams();
    formData.append("client_id", process.env.CLIENT_ID);
    formData.append("client_version", "1");
    formData.append("client_secret", process.env.CLIENT_SECRET);
    formData.append("grant_type", "client_credentials");

    const response = await axios.post(
      process.env.TOKEN_URL,
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Auth Token:", response.data);
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error fetching token:",
      error.response?.data || error.message
    );
    throw new Error(error.message);
  }
}
async function createOrder(amount: number, orderId: string) {
  try {
    const authToken = await getAuthToken();

    const requestBody = {
      merchantOrderId: orderId,
      amount: amount * 100,
      expireAfter: 3600,
      redirectUrl: "myapp://dashboard/paymentsuccess",
      paymentFlow: {
        type: "PG_CHECKOUT",
        paymentModeConfig: {
          enabledPaymentModes: [
            {
              type: "UPI_INTENT",
            },
            {
              type: "UPI_COLLECT",
            },
            {
              type: "UPI_QR",
            },
            {
              type: "NET_BANKING",
            },
            {
              type: "CARD",
              cardTypes: ["DEBIT_CARD", "CREDIT_CARD"],
            },
          ],
        },
      },
    };
    const devURl =
      "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/sdk/order";
    const prodURL = "https://api.phonepe.com/apis/pg/checkout/v2/sdk/order";
    const response = await axios.post(prodURL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${authToken}`,
      },
    });

    console.log("Payment Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error initiating payment:", error);
    throw new Error(error.message);
  }
}
async function initiatePayment(amount: number, orderId: string) {
  try {
    const authToken = await getAuthToken();

    const requestBody = {
      merchantOrderId: orderId,
      amount: amount * 100,
      expireAfter: 3600,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment message used for collect requests",
        merchantUrls: {
          redirectUrl: `https://iness.fitness/paystatus/${orderId}`,
          callbackUrl: `https://iness-backend.azurewebsites.net/api/payment-success`,
        },
      },
    };

    const response = await axios.post(process.env.PAYMENT_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${authToken}`,
      },
    });

    console.log("Payment Response:", response.data);
    return response.data.redirectUrl;
  } catch (error) {
    console.error("Error initiating payment:", error);
    throw new Error(error.message);
  }
}

export async function getTransactionData(
  userId: string,
  amount: number,
  phoneNumber: string,
  items: any
) {
  const MERCHANT_ID = process.env.MERCHENT_ID!;
  const CLIENT_ID = process.env.CLIENT_ID!;
  const SALT_KEY = process.env.CLIENT_SECRET!;
  const SALT_INDEX = "1";
  const orderId = uuidv4();
  console.log(SALT_KEY);
  console.log(SALT_INDEX);
  console.log(MERCHANT_ID);
  console.log(userId);
  console.log(orderId);

  const requestBody = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: "transaction_123",
    merchantUserId: "90223250",
    amount: amount * 100, // in paise
    callbackUrl: "https://iness-backend.azurewebsites.net/api/payment-callback",

    mobileNumber: phoneNumber.replace(/\D/g, "").slice(-10),
    paymentInstrument: {
      type: "UPI_INTENT",
      targetApp: "com.phonepe.app",
    },
    deviceContext: {
      deviceOS: "ANDROID",
    },
  };
  console.log(requestBody);

  const base64Body = Buffer.from(JSON.stringify(requestBody)).toString(
    "base64"
  );
  const apiEndPoint = "/pg/v1/pay";
  // Raw string to hash: base64Body + apiEndPoint + salt
  const rawChecksumString = base64Body + apiEndPoint + SALT_KEY;

  // Generate SHA-256 hash of the raw string
  const checksumHash = crypto
    .createHash("sha256")
    .update(rawChecksumString)
    .digest("hex");

  // Final checksum with salt index
  const checksum = `${checksumHash}###${SALT_INDEX}`;
  const paymentObj: any = {
    userId: new mongoose.Types.ObjectId(userId),
    amount: amount,
    status: "pending",
    items: items,
    orderId: orderId,
  };
  let response = await PaymentModel.create({ ...paymentObj });

  return {
    success: true,
    body: base64Body,
    checksum,
    orderId,
    merchantId: MERCHANT_ID,
    message: "Order placed successfully",
  };
}
async function getPaymentStatus(orderId: string) {
  try {
    const authToken = await getAuthToken();
    const response = await axios.get(
      process.env.STAUS_URL.replace(":merchantOrderId", orderId),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${authToken}`,
        },
      }
    );

    console.log("Payment status Response:", response.data);
    return response.data.state;
  } catch (error) {
    console.error("Error initiating payment:", error);
    throw new Error(error.message);
  }
}
export async function getUpdatePaymentStatus(orderId: string) {
  try {
    const orderStatus = await getPaymentStatus(orderId);
    const newStatus =
      orderStatus == "FAILED"
        ? "failed"
        : orderStatus == "COMPLETED"
        ? "success"
        : "pending";
    const paymentItemToBeUpdated = await PaymentModel.aggregate([
      { $match: { orderId: orderId } },
      { $sort: { createdAt: -1 } },

      //Lookup cart items linked to payment
      {
        $lookup: {
          from: "carts",
          let: { cartItems: "$items" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$cartItems"] } } },
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
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$planId"] } } },
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
                ],
                as: "planItemDetails",
              },
            },
            // Lookup diet plan details from `planDetails.dietPlanId`
            {
              $lookup: {
                from: "dietplans",
                let: {
                  dietPlanId: { $arrayElemAt: ["$planDetails.dietPlanId", 0] },
                },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } },
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
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
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
          ],
          as: "cartItems",
        },
      },
      // LookUp Coupon Details
      {
        $lookup: {
          from: "discountcoupon",
          localField: "couponCode",
          foreignField: "code",
          as: "couponDetails",
        },
      },

      // Projection for clean output
      {
        $project: {
          _id: 1,
          userId: 1,
          amount: 1,
          status: 1,
          isIndependentSession: 1,
          independentSessionCount: 1,
          refundAmount: 1,
          refundReason: 1,
          refundedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          cartItems: 1, //Nested cart items including product/plan details
          couponDetails: 1,
        },
      },
    ]);
    if (paymentItemToBeUpdated.length === 0) {
      return {
        message: "Payment Item with given id is not found",
        success: false,
      };
    }
    if (paymentItemToBeUpdated[0].status !== "pending") {
      return {
        message: "Payment Item with given id is already updated",
        success: false,
      };
    }
    const updatedPaymentItem = await PaymentModel.findByIdAndUpdate(
      paymentItemToBeUpdated[0]._id,
      { status: newStatus },
      { new: true }
    );

    console.log("paymentItemToBeUpdated[0]", paymentItemToBeUpdated[0]);
    if (newStatus === "success") {
      // Mark all cart items as deleted
      await CartModel.updateMany(
        { _id: { $in: updatedPaymentItem.items } },
        { $set: { isDeleted: true, isBought: true } }
      );
      const planAndDietPlan = [];
      paymentItemToBeUpdated[0].cartItems.map((item: any) => {
        if (item.dietPlanDetails || item.plan) {
          planAndDietPlan.push(item);
        }
      });

      const service = [];
      paymentItemToBeUpdated[0].cartItems.map((item: any) => {
        if (item.serviceDetails) {
          service.push(item);
        }
      });
      if (planAndDietPlan.length > 0) {
        await activePlanForUser(
          paymentItemToBeUpdated[0].userId,
          planAndDietPlan
        );
      }
      if (service.length > 0) {
        await activeServiceUser(paymentItemToBeUpdated[0].userId, service);
      }

      await addUserUsage(
        paymentItemToBeUpdated[0].couponDetails.code,
        paymentItemToBeUpdated[0].userId
      );
    }

    return {
      message: "Payment item updated successfully",
      success: true,
      data: updatedPaymentItem,
    };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

export async function validatePayment(receivedData: any) {
  try {
    console.log(receivedData);
    return {
      message: "added successfully",
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error initiating payment:", error);
    throw new Error(error.message);
  }
}

export async function getPaymentItems(
  userId: string,
  status: string,
  page?: string,
  limit?: string
) {
  try {
    let savedPaymentItems = [];
    let paginationInfo = null;
    const queryObj: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) {
      queryObj["status"] = status;
    }

    if (page && limit) {
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      const pageNumber = parsedPage > 0 ? parsedPage : 1;
      const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
      const skip = (pageNumber - 1) * itemsPerPage;

      savedPaymentItems = await PaymentModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: itemsPerPage },

        //Lookup cart items linked to payment
        {
          $lookup: {
            from: "carts",
            let: { cartItems: "$items" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$cartItems"] } } },
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
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$planId"] } } },
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
                  ],
                  as: "planItemDetails",
                },
              },
              // Lookup diet plan details from `planDetails.dietPlanId`
              {
                $lookup: {
                  from: "dietplans",
                  let: {
                    dietPlanId: {
                      $arrayElemAt: ["$planDetails.dietPlanId", 0],
                    },
                  },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } },
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
                          { $arrayElemAt: ["$planDetails", 0] }, // Extract plan object
                          {
                            planItem: {
                              $arrayElemAt: ["$planItemDetails", 0],
                            }, //  Nest planItem inside plan
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
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
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
                          { $arrayElemAt: ["$productDetails", 0] }, // Extract product object
                          {
                            variation: {
                              $arrayElemAt: ["$variationDetails", 0],
                            }, //  Nest variation inside plan
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
            ],
            as: "cartItems",
          },
        },

        // Projection for clean output
        {
          $project: {
            _id: 1,
            userId: 1,
            amount: 1,
            status: 1,
            isIndependentSession: 1,
            independentSessionCount: 1,
            refundAmount: 1,
            refundReason: 1,
            refundedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            cartItems: 1, //Nested cart items including product/plan details
          },
        },
      ]);

      const totalItems = await PaymentModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      paginationInfo = {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      };
    } else {
      savedPaymentItems = await PaymentModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1 } },

        //Lookup cart items linked to payment
        {
          $lookup: {
            from: "carts",
            let: { cartItems: "$items" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$cartItems"] } } },
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
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$planId"] } } },
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
                  ],
                  as: "planItemDetails",
                },
              },
              // Lookup diet plan details from `planDetails.dietPlanId`
              {
                $lookup: {
                  from: "dietplans",
                  let: {
                    dietPlanId: {
                      $arrayElemAt: ["$planDetails.dietPlanId", 0],
                    },
                  },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } },
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
                          { $arrayElemAt: ["$planDetails", 0] }, // Extract plan object
                          {
                            planItem: {
                              $arrayElemAt: ["$planItemDetails", 0],
                            }, //  Nest planItem inside plan
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
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
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
                          { $arrayElemAt: ["$productDetails", 0] }, // Extract product object
                          {
                            variation: {
                              $arrayElemAt: ["$variationDetails", 0],
                            }, //  Nest variation inside plan
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
            ],
            as: "cartItems",
          },
        },

        // Projection for clean output
        {
          $project: {
            _id: 1,
            userId: 1,
            amount: 1,
            status: 1,
            isIndependentSession: 1,
            independentSessionCount: 1,
            refundAmount: 1,
            refundReason: 1,
            refundedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            cartItems: 1, //Nested cart items including product/plan details
          },
        },
      ]);
    }
    return {
      message: "Payment item fetched successfully",
      success: true,
      data: savedPaymentItems,
      pagination: paginationInfo,
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getPaymentItem(orderId: string) {
  try {
    let savedPaymentItems = [];
    let paginationInfo = null;
    const queryObj: any = { orderId: orderId };
    savedPaymentItems = await PaymentModel.aggregate([
      { $match: queryObj },

      //Lookup cart items linked to payment
      {
        $lookup: {
          from: "carts",
          let: { cartItems: "$items" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$cartItems"] } } },
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
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$planId"] } } },
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
                ],
                as: "planItemDetails",
              },
            },
            // Lookup diet plan details from `planDetails.dietPlanId`
            {
              $lookup: {
                from: "dietplans",
                let: {
                  dietPlanId: {
                    $arrayElemAt: ["$planDetails.dietPlanId", 0],
                  },
                },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$dietPlanId"] } } },
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
                        { $arrayElemAt: ["$planDetails", 0] }, // Extract plan object
                        {
                          planItem: {
                            $arrayElemAt: ["$planItemDetails", 0],
                          }, //  Nest planItem inside plan
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
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
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
          ],
          as: "cartItems",
        },
      },

      // Projection for clean output
      {
        $project: {
          _id: 1,
          userId: 1,
          amount: 1,
          status: 1,
          isIndependentSession: 1,
          independentSessionCount: 1,
          refundAmount: 1,
          refundReason: 1,
          refundedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          cartItems: 1, //Nested cart items including product/plan details
          paymentUrl: 1,
        },
      },
    ]);

    return {
      message: "Payment item fetched successfully",
      success: true,
      data: savedPaymentItems,
      pagination: paginationInfo,
    };
  } catch (error) {
    throw new Error(error);
  }
}

//// Funciton for getting the payment details -------------------------------/
export async function getPaymentReceipt(orderId: string, userId: string) {
  try {
    // Step 1: Just check PaymentModel
    const step1 = await PaymentModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
    ]);
    console.log("Step 1:", JSON.stringify(step1, null, 2));

    const step2 = await PaymentModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
      {
        $lookup: {
          from: "carts",
          let: { cartItemIds: "$items" },
          pipeline: [
            {
              $match: { $expr: { $in: ["$_id", "$$cartItemIds"] } },
            },
          ],
          as: "cartItems",
        },
      },
    ]);
    console.log("Step 2:", JSON.stringify(step2, null, 2));
    const response = await PaymentModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(orderId) },
      },
      {
        $lookup: {
          from: "carts",
          let: { cartItemIds: "$items" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$cartItemIds"] },
              },
            },
            // Lookup diet plan (direct dietPlanId)
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
            {
              $unwind: {
                path: "$dietPlanDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            // Lookup plan (plan.planId)
            {
              $lookup: {
                from: "plans",
                localField: "plan.planId",
                foreignField: "_id",
                as: "planDetails",
              },
            },
            {
              $unwind: {
                path: "$planDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            // Lookup plan item (plan.planItemId)
            {
              $lookup: {
                from: "planitems",
                localField: "plan.planItemId",
                foreignField: "_id",
                as: "planItemDetails",
              },
            },
            {
              $unwind: {
                path: "$planItemDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            // Lookup dietPlanId inside planDetails
            {
              $lookup: {
                from: "dietplans",
                localField: "planDetails.dietPlanId",
                foreignField: "_id",
                as: "planDietPlanDetails",
              },
            },
            {
              $unwind: {
                path: "$planDietPlanDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            // Structure the final `plan` object
            {
              $addFields: {
                plan: {
                  $cond: [
                    { $gt: ["$planDetails", null] },
                    {
                      $mergeObjects: [
                        "$planDetails",
                        {
                          planItem: "$planItemDetails",
                          dietPlan: "$planDietPlanDetails",
                        },
                      ],
                    },
                    null,
                  ],
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
            {
              $project: {
                _id: 1,
                quantity: 1,
                dietPlanDetails: 1,
                plan: 1,
                product: 1,
                serviceDetails: { $arrayElemAt: ["$serviceDetails", 0] },
              },
            },
          ],
          as: "cartItems",
        },
      },
      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Final output shape
      {
        $project: {
          _id: 1,
          orderId: 1,
          userId: 1,
          amount: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          cartItems: 1,
          userDetails: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
          },
        },
      },
    ]);
    console.log("this is response");
    console.log(response);

    if (!response || response.length === 0) {
      return {
        success: false,
        message: "No payment found for this order",
        receipt: null,
      };
    }

    const pdfBuffer = await generateReceiptPdf(response);
    const reciptUrl = await uploadUserReceiptPdfWithSas(pdfBuffer, userId);
    return {
      success: true,
      message: "Receipt data fetched successfully",
      receipt: reciptUrl,
    };
  } catch (error) {
    console.log("this is error");
    console.log(error.message);

    return {
      success: false,
      message: error.message,
      receipt: null,
    };
  }
}
