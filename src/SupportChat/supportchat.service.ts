import { Conversation } from "twilio/lib/twiml/VoiceResponse";
import SupportChatModel from "./supportchat.model";

///// Function for getting the support chat ------------------------------------------------/

export const getSupportChat = async (userId: string) => {
  try {
    // Getting The Chat Based on ChatId and type---------------------/
    const chatResponse = await SupportChatModel.findOne({
      userId: userId,
    });

    if (chatResponse) {
      return {
        message: "Chat Details found",
        data: chatResponse.conversation,
        chatId: chatResponse._id,
        success: true,
      };
    } else {
      return {
        message: "Chat doesn't exist yet",
        data: [],
        chatId: undefined,
        success: true,
      };
    }
  } catch (error) {
    return {
      message: `Some error happend ${error.message}`,
      data: [],
      chatId: undefined,
      success: false,
    };
  }
};

export const postSupportChat = async (
  conversation: any,
  userId: string
): Promise<{
  success: boolean;
  message: string;
  chatDetails?: any;
  error?: string;
}> => {
  try {
    // Check if chat already exists for user
    const existingChat = await SupportChatModel.findOne({ userId });

    if (existingChat) {
      // Determine update type based on role
      const updateFields: any = {
        $push: { conversation },
      };

      if (conversation.role === "user") {
        updateFields.$set = { newUserMessage: true };
      } else {
        updateFields.$set = { newSupportMessage: true };
      }

      const updatedChat = await SupportChatModel.findOneAndUpdate(
        { _id: existingChat.id },
        updateFields,
        { new: true }
      );

      return {
        success: true,
        message: "Chat has been updated",
        chatDetails: updatedChat,
      };
    } else {
      // Create new chat if it doesn't exist
      const newChatData: any = {
        conversation: [conversation],
        userId,
        newUserMessage: conversation.role === "user",
        newSupportMessage: conversation.role !== "user",
      };

      const newChat = new SupportChatModel(newChatData);
      const savedChat = await newChat.save();

      return {
        success: true,
        message: "New chat created",
        chatDetails: savedChat,
      };
    }
  } catch (error: any) {
    console.error("Error in postSupportChat:", error);
    return {
      success: false,
      message: "Failed to post support chat",
      error: error.message || "Unknown error",
    };
  }
};
