import WebsiteContentModel, { WebsiteContent } from "./websitecontent.model";
///// Function for the updating website content -----------------------------------/
export const createWebsiteContent = async (
  data: any
): Promise<{
  message: string;
  success: boolean;
  data: WebsiteContent;
}> => {
  try {
    // Delete existing content
    await WebsiteContentModel.deleteMany({});

    // Create new content
    const newContent = await WebsiteContentModel.create(data);

    return {
      success: true,
      message: "Website content updated successfully.",
      data: newContent,
    };
  } catch (error: any) {
    console.error("Error updating website content:", error);

    return {
      success: false,
      message: error.message || "An error occurred while updating content.",
      data: null,
    };
  }
};

///// Function for fetching the website content --------------------------------/
export async function fetchWebsiteContent(): Promise<{
  message: string;
  success: boolean;
  data: WebsiteContent;
}> {
  try {
    // Create new content
    const websiteContent = await WebsiteContentModel.findOne();

    return {
      success: true,
      message: "Website content fetched successfully.",
      data: websiteContent,
    };
  } catch (error: any) {
    console.error("Error fetching website content:", error);

    return {
      success: false,
      message: error.message || "An error occurred while fetching content.",
      data: null,
    };
  }
}
