/** @format */

import mongoose, { Schema, Document } from "mongoose";

export interface TrainerChat extends Document {
  chatId: string; // Format: userId-trainerId
  conversation: Array<object>;
  newUserMessage: boolean;
  newTrainerMessage: boolean;
}

const trainerChatSchema: Schema<TrainerChat> = new Schema<TrainerChat>({
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  newUserMessage: {
    type: Boolean,
    default: false,
  },
  newTrainerMessage: {
    type: Boolean,
    default: false,
  },
  conversation: [
    {
      role: {
        type: String,
        required: true,
        enum: ["user", "trainer"],
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
        default: Date.now,
      },
    },
  ],
});

const TrainerChatModel = mongoose.model<TrainerChat>(
  "TrainerChat",
  trainerChatSchema
);

export default TrainerChatModel;
