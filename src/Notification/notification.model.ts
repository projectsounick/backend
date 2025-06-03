/** @format */

import mongoose, { Schema, Document } from "mongoose";

export interface Notification extends Document {
  title: string;
  body: string;
  isAdmin: boolean;
  isTrainer: boolean;
  isHr: boolean;
  userId?: string; // optional in case it's a broadcast
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema: Schema<Notification> = new Schema<Notification>(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isTrainer: {
      type: Boolean,
      default: false,
    },
    isHr: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String,
      ref: "User", // assuming the collection/model is named 'User'
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  }
);

const NotificationModel = mongoose.model<Notification>(
  "Notification",
  notificationSchema
);

export default NotificationModel;
