import TransformationImageModel from "./transformationImages.model";
import mongoose from "mongoose";

interface ImageItem {
  url: string;
  date: Date;
}

// Get transformation images for a user
export const getTransformationImagesByUserId = async (userId: string) => {


  const transformationImages = await TransformationImageModel.findOne({
    userId,
  });

  if (!transformationImages) {
    return {
      success: true,
      message: "No transformation images found",
      data: [],
    };
  }

  return {
    success: true,
    message: "Transformation images fetched successfully",
    data: transformationImages.images,
  };
};

// Add transformation images for a user
export const addTransformationImages = async (
  userId: string,
  images: ImageItem[]
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      success: false,
      message: "Invalid user ID",
    };
  }

  const existing = await TransformationImageModel.findOne({ userId });

  if (existing) {
    existing.images.push(...images);
    await existing.save();
    return {
      success: true,
      message: "Images added successfully to existing user",
      data: images,
    };
  } else {
    const newEntry = new TransformationImageModel({
      userId,
      images,
    });
    await newEntry.save();
    return {
      success: true,
      message: "New transformation image record created",
      data: images,
    };
  }
};
