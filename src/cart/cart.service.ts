import CartModel from "./cart.model";

export async function addCart(userId: string, data: Record<string, any>) {
  try {
    const savedCart = await CartModel.create({ userId, ...data });
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
    const queryObj: any = { userId };

    if (status !== null) {
      queryObj["isActive"] = status;
    }

    const cartItems = await CartModel.aggregate([
      { $match: queryObj }, // ✅ Filter by userId & status
      { $sort: { createdAt: -1 } }, // ✅ Sort by recent entries
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
        $project: {
          _id: 1,
          userId: 1,
          quantity: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          productDetails: { $arrayElemAt: ["$productDetails", 0] }, // ✅ Ensure single product
          planDetails: { $arrayElemAt: ["$planDetails", 0] }, // ✅ Ensure single plan
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
