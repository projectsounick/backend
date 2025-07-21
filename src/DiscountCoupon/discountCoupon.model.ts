import mongoose, { Schema, Document } from "mongoose";

export interface DiscountCoupon extends Document {
  name: string;
  code: string;
  discountPrice: number;
  totalUsage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountCouponSchema: Schema<DiscountCoupon> = new Schema<DiscountCoupon>(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountPrice: {
      type: Number,
      required: true,
    },
    totalUsage: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

const DiscountCouponModel = mongoose.model<DiscountCoupon>(
  "discountcoupon",
  DiscountCouponSchema
);
export default DiscountCouponModel;
