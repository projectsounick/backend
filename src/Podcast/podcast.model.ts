import mongoose, { Schema, Document } from "mongoose";

interface PodcastInteractions {
  comment: string;
  userName: string;
  userId: string;
}

export interface Podcast extends Document {
  podcastName: string;
  podcastLink: string;
  category: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  interactions: PodcastInteractions[];
  thumbnailImageLink: string;
  description: string;
  likes: string[]; // array of userIds
}

const podcastInteractionSchema = new Schema<PodcastInteractions>({
  comment: { type: String, required: false },
  userName: { type: String, required: false },
  userId: { type: String, required: false },
});

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
    interactions: [podcastInteractionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thumbnailImageLink: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    likes: [{ type: String }], // now a simple array of userId strings
  },
  { timestamps: true }
);

// Add indexes for better query performance
podcastSchema.index({ createdAt: -1 }); // Index for sorting by creation date
podcastSchema.index({ category: 1 }); // Index for filtering by category (if needed in future)
podcastSchema.index({ createdBy: 1 }); // Index for filtering by creator (if needed in future)

const PodcastModel = mongoose.model<Podcast>("Podcast", podcastSchema);

export default PodcastModel;
