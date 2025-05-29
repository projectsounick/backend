import mongoose, { Schema, Document } from "mongoose";

export interface Cart extends Document {
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    quantity: number;
    isDeleted:boolean;
    createdAt: Date;
    updatedAt: Date;
}
const CartSchema: Schema<Cart> = new Schema<Cart>({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "users",
        required: true,
    },
    productId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "products",
        required: false,
    },
    planId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "plans",
        required: false,
    },
    quantity:{
        type:Number,
        required:true,
        default:1
    },
    isDeleted:{
        type:Boolean,
        required:true,
        default:false
    },
    createdAt: {
        type: Date,
        default: () => {
            return Date.now();
        },
        immutable: true,
    },
    updatedAt: {
        type: Date,
        default: () => {
            return Date.now();
        },
    },
});
const CartModel = mongoose.model<Cart>("cart", CartSchema);
export default CartModel;

