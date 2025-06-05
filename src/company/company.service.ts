
// import CartModel from "./cart.model";

// export async function addCart(data: Record<string, any>) {
//   try {
//     const savedCart = await CartModel.create({ ...data });
//     return {
//       message: "added successfully",
//       success: true,
//       data: savedCart,
//     };

//   } catch (error) {
//     throw new Error(error);
//   }
// }
// export async function getCart(userId:string,status: boolean) {
//     try {
//         let cartItems;
//         const queryObj: any = {userId:userId}
//         if (status !== null) {
//             queryObj['isActive'] = status;
//         }
//         cartItems = await CartModel.find(queryObj).sort({ createdAt: -1 });

//         return {
//             message: "cart item fetched successfully",
//             success: true,
//             data: cartItems
//         };
//     } catch (error) {
//         throw new Error(error);
//     }
// }
// export async function updateCartItem(cartItemId: string,action : 'increment' | 'decrement') {
//   try {
//     const cartItemToBeUpdated = await CartModel.findById(cartItemId);
//     if (!cartItemToBeUpdated) {
//       return {
//         message: "cart item with given id is not found",
//         success: false,
//       };
//     }
//     if (action === 'increment') {
//       cartItemToBeUpdated.quantity += 1;
//     } else if (action === 'decrement') {
//       if (cartItemToBeUpdated.quantity > 1) {
//         cartItemToBeUpdated.quantity -= 1;
//       } else {
//         return {
//           message: "Quantity cannot be less than 1",
//           success: false,
//         };
//       }
//     }
//     const updatedCartItem = await cartItemToBeUpdated.save();

//     return {
//       message: "Cart Item updated successfully",
//       success: true,
//       data: updatedCartItem,
//     };
//   } catch (error) {
//     throw new Error(error);
//   }
// }
