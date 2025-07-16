import TransformationImageModel from "./transformationImages.model";
import mongoose from "mongoose";

interface ImageItem {
  url: string;
  date: Date;
}

// Get transformation images for a user
export const getTransformationImagesByUserId = async (userId: string) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        message: "Invalid user ID format",
        data: [],
      };
    }

    const groupedImages = await TransformationImageModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $unwind: "$images",
      },
      {
        $project: {
          url: "$images.url",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$images.date" },
          },
          originalDate: "$images.date",
        },
      },
      {
        $group: {
          _id: "$date",
          images: {
            $push: {
              url: "$url",
              date: "$originalDate",
            },
          },
        },
      },
      {
        $sort: {
          _id: 1, // Sort date groups ascending
        },
      },
    ]);

    // ✅ Manually sort the images within each group by date descending
    const sortedGroupedData = groupedImages
      .map((group) => ({
        date: group._id,
        images: group.images.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 🔥 sort groups DESC

    return {
      success: true,
      message: sortedGroupedData.length
        ? "Transformation images grouped by date"
        : "No transformation images found",
      data: sortedGroupedData,
    };
  } catch (error) {
    console.error("Error fetching transformation images:", error);

    return {
      success: false,
      message: "Something went wrong while fetching transformation images",
      data: [],
    };
  }
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

  // ✅ Convert each image date to IST (if not already)
  const imagesWithIST = images.map((img) => ({
    ...img,
    date: new Date(
      new Date(img.date || Date.now()).getTime() + 5.5 * 60 * 60 * 1000
    ),
  }));

  const existing = await TransformationImageModel.findOne({ userId });

  if (existing) {
    existing.images.push(...imagesWithIST);
    await existing.save();
    return {
      success: true,
      message: "Images added successfully to existing user",
      data: imagesWithIST,
    };
  } else {
    const newEntry = new TransformationImageModel({
      userId,
      images: imagesWithIST,
    });
    await newEntry.save();
    return {
      success: true,
      message: "New transformation image record created",
      data: imagesWithIST,
    };
  }
};
