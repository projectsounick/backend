import mongoose, { Schema, Document } from "mongoose";

export interface Coupon extends Document {
  title: string;
  description: string;
  code: string;
  assignedUsers: mongoose.Types.ObjectId[]; // References to users
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema: Schema<Coupon> = new Schema<Coupon>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  assignedUsers: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
    },
  ],

  createdAt: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

couponSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const CouponModel = mongoose.model<Coupon>("coupons", couponSchema);

export default CouponModel;
