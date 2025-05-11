/** @format */

import mongoose, { Schema, Document } from "mongoose";

export interface SupportChat extends Document {
  userId: string;
  conversation: Array<object>;
  newUserMessage: boolean;
  newSupportMessage: boolean;
}

const supportChatSchema: Schema<SupportChat> = new Schema<SupportChat>({
  userId: {
    type: String,
    required: true,
    ref: "User",
  },
  newUserMessage: {
    type: Boolean,
  },
  newSupportMessage: {
    type: Boolean,
  },
  conversation: [
    {
      supportId: {
        type: String,
        ref: "User",
      },
      role: {
        type: String,
        required: true,
        enum: ["user", "support"],
        default: "user",
      },
      content: {
        type: String,
      },
      attachments: {
        type: Array<String>,
      },
      date: {
        type: Date,
      },
    },
  ],
});

const SupportChatModel = mongoose.model<SupportChat>(
  "SupportChat",
  supportChatSchema
);

export default SupportChatModel;
