import mongoose from "mongoose";
import PaymentModel from "./payment.model";
import { activePlanForUser } from "../userActivePlans/activePlans.service";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import CartModel from "../cart/cart.model";
import { generateReceiptPdf } from "./ReciptUtils";
import { uploadUserReceiptPdfWithSas } from "../azure/azureService";

export async function addPaymentItem(
  userId: string,
  amount: number,
  items: Array<string>
) {
  try {
    if (items.length === 0) {
      return {
        message: "items cannot be empty",
        success: false,
      };
    }
    const orderId = uuidv4();
    const redirectUrl = await initiatePayment(amount * 100, orderId);
    console.log("redirectUrl", redirectUrl);
    const paymentObj: any = {
      userId: new mongoose.Types.ObjectId(userId),
      amount: amount,
      status: "pending",
      items: items,
      orderId: orderId,
    };
    const savedPaymentItem = await PaymentModel.create({ ...paymentObj });
    return {
      message: "added successfully",
      success: true,
      data: savedPaymentItem,
      redirectUrl: redirectUrl,
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
async function initiatePayment(amount: number, orderId: string) {
  try {
    const authToken = await getAuthToken();

    const requestBody = {
      merchantOrderId: orderId,
      amount: amount,
      expireAfter: 3600,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment message used for collect requests",
        merchantUrls: {
          redirectUrl: `myapp://dashboard/paymentsuccess?orderId=${orderId}`,
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
async function getPaymentStatus(orderId: string) {
  try {
    const authToken = await getAuthToken();
    const response = await axios.get(
      `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${orderId}/status`,
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
export async function updatePaymentItem(orderId: string) {
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
    // Mark all cart items as deleted
    await CartModel.updateMany(
      { _id: { $in: updatedPaymentItem.items } },
      { $set: { isDeleted: true, isBought: true } }
    );
    console.log("paymentItemToBeUpdated[0]", paymentItemToBeUpdated[0]);
    if (newStatus === "success") {
      await activePlanForUser(
        paymentItemToBeUpdated[0].userId,
        paymentItemToBeUpdated[0].cartItems
      );
    }

    return {
      message: "Payment item updated successfully",
      success: true,
      data: updatedPaymentItem,
    };
  } catch (error) {
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
  } catch (error) {
    throw new Error(error);
  }
}

//// Funciton for getting the payment details -------------------------------/
export async function getPaymentReceipt(orderId: string, userId: string) {
  try {
    const response = await PaymentModel.aggregate([
      {
        $match: { orderId: orderId },
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
            {
              $project: {
                _id: 1,
                quantity: 1,
                dietPlanDetails: 1,
                plan: 1,
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
    const pdfBuffer = await generateReceiptPdf(response);
    const reciptUrl = await uploadUserReceiptPdfWithSas(pdfBuffer, userId);
    return {
      success: true,
      message: "Receipt data fetched successfully",
      receipt: reciptUrl,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      receipt: null,
    };
  }
}
