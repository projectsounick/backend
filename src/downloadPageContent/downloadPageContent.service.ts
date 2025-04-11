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

export const fetchDownloadPageContent = async (): Promise<{
  message: string;
  success: boolean;
  data: DownloadPageContent;
}> => {
  try {
    // Create new content
    const DownloadPageContent = await DownloadPageContentModel.findOne();

    return {
      success: true,
      message: "Download page content fetched successfully.",
      data: DownloadPageContent,
    };
  } catch (error: any) {
    console.error("Error fetching download content:", error);

    return {
      success: false,
      message: error.message || "An error occurred while updating content.",
      data: null,
    };
  }
}
