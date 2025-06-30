import mongoose, { Schema, Document } from "mongoose";

export interface AdminNotificationData {
  screenName: string;
  videoCallId: mongoose.Types.ObjectId;
  channelName: string;
  type: "video";
}

export interface AdminNotification extends Document {
  title: string;
  body: string;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  data: AdminNotificationData;
  read: boolean;
  createdAt: Date;
}

const AdminNotificationDataSchema = new Schema<AdminNotificationData>(
  {
    screenName: {
      type: String,
      required: false,
    },
    videoCallId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "videocalls",
      required: false,
    },
    channelName: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const AdminNotificationSchema = new Schema<AdminNotification>({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  senderId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  receiverId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  data: {
    type: AdminNotificationDataSchema,
    required: false,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const AdminNotificationModel = mongoose.model<AdminNotification>(
  "AdminNotifications",
  AdminNotificationSchema
);

export default AdminNotificationModel;
