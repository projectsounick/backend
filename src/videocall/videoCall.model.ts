import mongoose, { Schema, Document } from "mongoose";

export interface Participant {
  userId: mongoose.Types.ObjectId;
  uid?: string | number;
  token?: string;
}

export interface VideoCall extends Document {
  creatorId: mongoose.Types.ObjectId;
  participants: Participant[];
  channelName: string;
  duration: string;
  callId: number;
  token: string;
  createdAt: Date;
  active: boolean;
  endedAt?: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<Participant>(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: true,
    },
    uid: {
      type: Schema.Types.Mixed, // Accepts string or number
      required: false,
    },
    token: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const VideoCallSchema: Schema<VideoCall> = new Schema<VideoCall>({
  creatorId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  participants: {
    type: [ParticipantSchema],
    required: true,
  },
  channelName: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,

    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  callId: {
    type: Number,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
  },
  endedAt: {
    type: Date,
    required: false,
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
});

const VideoCallModel = mongoose.model<VideoCall>("videocalls", VideoCallSchema);
export default VideoCallModel;
