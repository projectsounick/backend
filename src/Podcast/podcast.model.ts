import mongoose, { Schema, Document } from "mongoose";

export interface Podcast extends Document {
  podcastName: string;
  podcastLink: string;
  category: string;
  createdBy: mongoose.Types.ObjectId; // Refers to User model
  createdAt?: Date;
  updatedAt?: Date;
}

const podcastSchema: Schema<Podcast> = new Schema<Podcast>(
  {
    podcastName: {
      type: String,
      required: true,
    },
    podcastLink: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming the user model is named "User"
      required: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const PodcastModel = mongoose.model<Podcast>("Podcast", podcastSchema);

export default PodcastModel;
