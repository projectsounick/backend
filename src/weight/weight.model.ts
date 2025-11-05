import mongoose, { Schema, Document } from "mongoose";

export interface WeightTrack extends Document {
  userId: mongoose.Types.ObjectId;
  weight: number;
  date: Date;

  createdAt: Date;
  updatedAt: Date;
}

const WeightTrackSchema: Schema<WeightTrack> = new Schema<WeightTrack>({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: () => Date.now(),
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

const WeightTrackModel = mongoose.model<WeightTrack>(
  "weighttrack",
  WeightTrackSchema
);

export default WeightTrackModel;
