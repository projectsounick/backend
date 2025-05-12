import mongoose, { Schema, Document } from "mongoose";


export interface Plan extends Document {
  title: string;
  descItems: Array<string>;
  imgUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const planSchema: Schema<Plan> = new Schema<Plan>({
  title: {
    type: String,
    required: true,
  },
  descItems: {
    type: [String],
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: false,
    default: true,
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
const PlanModel = mongoose.model<Plan>("plans", planSchema);



export interface PlanItems extends Document {
  planId: mongoose.Types.ObjectId;
  price: number;
  isOnline: boolean;
  isCorporate: boolean;
  duration: number;
  durationType: 'day' | 'week' | 'month' | 'year';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const planItemSchema: Schema<PlanItems> = new Schema<PlanItems>({
  planId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "plans",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  isOnline: {
    type: Boolean,
    required: true,
    default: false,
  },
  isCorporate: {
    type: Boolean,
    required: true,
    default: false,
  },
  duration: {
    type: Number,
    required: true,
  },
  durationType: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
    required: true,
  },

  isActive: {
    type: Boolean,
    required: false,
    default: true,
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
const PlanItemModel = mongoose.model<PlanItems>("planItemss", planItemSchema);

export default PlanModel;
export { PlanItemModel };
