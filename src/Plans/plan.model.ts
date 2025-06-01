import mongoose, { Schema, Document } from "mongoose";

// Plan Type
export interface PlanType extends Document {
  title: string;
  desc: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const planTypeSchema: Schema<PlanType> = new Schema<PlanType>({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  desc: {
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
const PlanTypeModel = mongoose.model<PlanType>("plantypes", planTypeSchema);

// Plan
export interface Plan extends Document {
  planTypeId: mongoose.Types.ObjectId;
  title: string;
  descItems: Array<string>;
  imgUrl: string;
  // if diet plan is included
  dietPlanId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const planSchema: Schema<Plan> = new Schema<Plan>({
  planTypeId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "planTypes",
    required: true,
  },
  title: {
    type: String,
    required: true,
    unique: true,
  },
  descItems: {
    type: [String],
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  // if diet plan is included
  dietPlanId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "dietplans",
    required: false,
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

// Plan Items
export interface PlanItems extends Document {
  planId: mongoose.Types.ObjectId;
  price: number;
  isOnline: boolean;
  isCorporate: boolean;
  duration: number;
  durationType: 'day' | 'week' | 'month' | 'year';
  sessionCount: number;
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
  sessionCount: {
    type: Number,
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
const PlanItemModel = mongoose.model<PlanItems>("planitems", planItemSchema);

// Diet Plan
export interface DietPlan extends Document {
  title: string;
  descItems: Array<string>;
  imgUrl: string;
  duration: number;
  durationType: 'day' | 'week' | 'month' | 'year';
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const dietPlanSchema: Schema<DietPlan> = new Schema<DietPlan>({
  title: {
    type: String,
    required: true
  },
  descItems: {
    type: [String],
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
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
  price: {
    type: Number,
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
const DietPlanModel = mongoose.model<DietPlan>("dietplans", dietPlanSchema);

export default PlanModel;
export { PlanTypeModel, PlanItemModel, DietPlanModel };
