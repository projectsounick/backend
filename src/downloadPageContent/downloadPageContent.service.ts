import DownloadPageContentModel, {
  DownloadPageContent,
} from "./downloadPageContent.model";

export const createDownloadPageContent = async (
  data: DownloadPageContent
): Promise<any> => {
  try {
    // Delete existing entries
    await DownloadPageContentModel.deleteMany({});

    const newEntry = new DownloadPageContentModel(data);
    let response = await newEntry.save();
    if (response) {
      return {
        success: true,
        message: "Download page content created successfully.",
        data: response,
      };
    } else {
      return {
        success: false,
        message: "Unable to update the download page content",
        data: null,
      };
    }
  } catch (error: any) {
    console.error("Error creating download page content:", error);
    return {
      success: false,
      message: error?.message || "Something went wrong while creating content.",
      data: null,
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
    if (DownloadPageContent) {
      return {
        success: true,
        message: "Download page content fetched successfully.",
        data: DownloadPageContent,
      };
    } else {
      return {
        success: false,
        message: "Download page content not avaialble",
        data: null,
      };
    }
  } catch (error: any) {
    console.error("Error fetching download content:", error);

    return {
      success: false,
      message: error.message || "An error occurred while updating content.",
      data: null,
    };
  }
};
