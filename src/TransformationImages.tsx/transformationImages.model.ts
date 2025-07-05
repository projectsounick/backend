import mongoose, { Schema, Document } from "mongoose";

interface ImageItem {
  url: string;
  date: Date;
}

interface TransformationImage extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  images: ImageItem[];
}

const imageItemSchema = new Schema<ImageItem>({
  url: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now(),
  },
});

const transformationImageSchema = new Schema<TransformationImage>(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    images: {
      type: [imageItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const TransformationImageModel = mongoose.model<TransformationImage>(
  "transformationimage",
  transformationImageSchema
);

export default TransformationImageModel;
export { TransformationImage };
