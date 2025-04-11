import DownloadPageContentModel, {
  DownloadPageContent,
} from "./downloadPageContent.model";

export const createDownloadPageContent = async (
  data: DownloadPageContent
): Promise<any> => {
  try {
    // Delete existing entries
    await DownloadPageContentModel.deleteMany({});

    // Create new entry
    const newEntry = new DownloadPageContentModel(data);
    await newEntry.save();

    return {
      success: true,
      message: "Download page content created successfully.",
    };
  } catch (error: any) {
    console.error("Error creating download page content:", error);
    return {
      success: false,
      message: error?.message || "Something went wrong while creating content.",
    };
  }
};
