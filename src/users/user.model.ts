import mongoose, { Schema, Document } from "mongoose";

// Basic user model
export interface User extends Document {
  phoneNumber?: string;
  otp: number;
  onboarding: boolean;
  email?: string;
  role: "user" | "admin" | "trainer" | "hr";
  name: string;
  dob: Date;
  sex: string;
  isActive: boolean;
  createdAt: Date;
  expoPushToken: string;
  updatedAt: Date;
  profilePic: string;
}
const userSchema: Schema<User> = new Schema<User>({
  phoneNumber: {
    type: String,
    required: false,
    unique: true,
  sparse: true, // <-- only enforces uniqueness when phoneNumber is present
  },
  expoPushToken: {
    type: String,
    required: false,
  },
  profilePic: {
    type: String,
    required: false,
  },
  otp: {
    type: Number,
    required: false,
  },
  onboarding: {
    type: Boolean,
    required: false,
    default: false,
  },
  email: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    required: true,
    default: "user",
  },
  name: {
    type: String,
    required: false,
  },
  dob: {
    type: Date,
    required: false,
  },
  sex: {
    type: String,
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
const UserModel = mongoose.model<User>("users", userSchema);

// User Details model for extra details
export interface UserDetails extends Document {
  userId: mongoose.Types.ObjectId;
  height: string;
  weight: string;
  targetWeight: string;
  medicalConditions: string[];
  goal: string;
  secondaryGoal: string[];
  timeCommitment: string;
  preferredWorkoutTime: string;
  workoutPreferences: string[];
  preferredWorkoutLocation: string;
  activityLevel: string;
  assignedCoupons: string[];
  companyId: mongoose.Types.ObjectId;
  preferences: {
    date: string;
    slot: string;
    address: string;
  };
}
const userDetailsSchema: Schema<UserDetails> = new Schema<UserDetails>({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  assignedCoupons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupons", // Make sure your Coupon model is named "coupons"
    },
  ],
  height: {
    type: String,
    required: false,
  },
  weight: {
    type: String,
    required: false,
  },
  targetWeight: {
    type: String,
    required: false,
  },
  medicalConditions: {
    type: [String],
    required: false,
  },
  goal: {
    type: String,
    required: false,
  },
  secondaryGoal: {
    type: [String],
    required: false,
  },
  timeCommitment: {
    type: String,
    required: false,
  },
  preferredWorkoutTime: {
    type: String,
    required: false,
  },
  workoutPreferences: {
    type: [String],
    required: false,
  },
  preferredWorkoutLocation: {
    type: String,
    required: false,
  },
  activityLevel: {
    type: String,
    required: false,
  },
  companyId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "companies",
    required: false,
  },
  preferences: {
    date: { type: String, required: false },
    slot: { type: String, required: false },
    address: { type: String, required: false },
  },
});
const UserDetailsModel = mongoose.model<UserDetails>(
  "userdetails",
  userDetailsSchema
);

// Trainer Details for extra details
export interface TrainerDetails extends Document {
  userId: mongoose.Types.ObjectId;
  achievements: string[];
}
const trainerDetailsSchema: Schema<TrainerDetails> = new Schema<TrainerDetails>(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: true,
    },
    achievements: {
      type: [String],
      required: false,
    },
  }
);
const TrainerDetailsModel = mongoose.model<TrainerDetails>(
  "trainerdetails",
  trainerDetailsSchema
);

// Hr Details for extra details
export interface HrDetails extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
}
const hrDetailsSchema: Schema<HrDetails> = new Schema<HrDetails>({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  companyId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "companies",
    required: true,
  },
});
const HRDetailsModel = mongoose.model<HrDetails>("hrdetails", hrDetailsSchema);

export default UserModel;
export { UserDetailsModel, TrainerDetailsModel, HRDetailsModel };
