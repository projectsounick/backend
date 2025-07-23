import mongoose, { Schema, Document } from "mongoose";

export interface DiscountCouponUsage extends Document {
    userId: mongoose.Types.ObjectId;
    couponCode: string;
    createdAt: Date;
    updatedAt: Date;
}

const DiscountCouponUsageSchema: Schema<DiscountCouponUsage> = new Schema<DiscountCouponUsage>(
    {
        userId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "users",
            required: true,
        },
        couponCode: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: () => Date.now(),
            immutable: true,
        },
        updatedAt: {
            type: Date,
            default: () => Date.now(),
        },
    }
);

const DiscountCouponUsageModel = mongoose.model<DiscountCouponUsage>(
    "discountcouponusages",
    DiscountCouponUsageSchema
);
export default DiscountCouponUsageModel;
