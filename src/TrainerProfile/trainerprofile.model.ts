import mongoose, { Schema, Document } from "mongoose";
import {
  TrainerCertificatesInterface,
  TrainerReviewsInterface,
} from "../interface/TrainerInterface";

export interface TrainerProfile extends Document {
  trainerCertificates: TrainerCertificatesInterface[];
  trainerCode: string;
  trainerClients: Array<string>;
  trainerReviews: TrainerReviewsInterface[];
}

const trainerSchema: Schema<TrainerProfile> = new Schema<TrainerProfile>({
  trainerCertificates: [
    {
      certificateName: { type: String, required: false },
      certificateImage: { type: String, required: false },
    },
  ],
  trainerCode: {
    type: String,
    required: false,
  },
  trainerClients: [{ type: String, required: false, ref: "user" }],
  trainerReviews: [
    {
      message: {
        type: String,
        required: false,
      },
      reviewer: {
        type: String,
        required: false,
        ref: "user",
      },
      rating: {
        type: Number,
        required: false,
      },
    },
  ],
});

// This method dynamically returns the correct model based on the active DB connection

const TrainerProfileModel = mongoose.model<TrainerProfile>(
  "trainerprofile",
  trainerSchema
);

export default TrainerProfileModel;
