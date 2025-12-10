import mongoose, { Schema, Document } from "mongoose";

export interface Cart extends Document {
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    dietPlanId: mongoose.Types.ObjectId;
    plan: {
        planId: mongoose.Types.ObjectId;
        planItemId: mongoose.Types.ObjectId;
    },
    product: {
        productId: mongoose.Types.ObjectId;
        variationId: mongoose.Types.ObjectId;
    },
    serviceId: mongoose.Types.ObjectId;
    quantity: number;
    isDeleted: boolean;
    isBought: boolean;
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
    dietPlanId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "dietplans",
        required: false,
    },
    plan: {
        type: {
            planId: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: "plans"
            },
            planItemId: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: "planitems"
            },
        },
        required: false,
        _id: false
    },
    product: {
        type: {
            productId: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: "products"
            },
            variationId: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: "productvariations"
            },
        },
        required: false,
        _id: false
    },
    serviceId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "services",
        required: false,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    },
    isBought: {
        type: Boolean,
        required: false,
        default: false
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
// Add indexes for better query performance
CartSchema.index({ userId: 1, isDeleted: 1 });
CartSchema.index({ createdAt: -1 }); 
CartSchema.index({ userId: 1, isBought: 1 }); 

const CartModel = mongoose.model<Cart>("cart", CartSchema);
export default CartModel;

