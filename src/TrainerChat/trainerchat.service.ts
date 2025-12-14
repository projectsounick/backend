import TrainerChatModel from "./trainerchat.model";
import UserModel from "../users/user.model";
import {
  createNotification,
  sendPushNotifications,
} from "../Notification/notification.service";

// Helper function to extract userId and trainerId from chatId
const extractIdsFromChatId = (chatId: string): { userId: string; trainerId: string } | null => {
  const parts = chatId.split("-");
  if (parts.length >= 2) {
    // Handle case where userId or trainerId might contain hyphens
    // Last part is trainerId, everything before is userId
    const trainerId = parts[parts.length - 1];
    const userId = parts.slice(0, -1).join("-");
    return { userId, trainerId };
  }
  return null;
};

///// Function for getting the trainer chat ------------------------------------------------/

export const getTrainerChat = async (chatId: string) => {
  try {
    // Getting The Chat Based on ChatId ---------------------/
    const chatResponse = await TrainerChatModel.findOne({
      chatId: chatId,
    });

    if (chatResponse) {
      return {
        message: "Chat Details found",
        data: chatResponse.conversation,
        chatId: chatResponse.chatId,
        success: true,
      };
    } else {
      return {
        message: "Chat doesn't exist yet",
        data: [],
        chatId: chatId,
        success: true,
      };
    }
  } catch (error: any) {
    return {
      message: `Some error happened ${error.message}`,
      data: [],
      chatId: undefined,
      success: false,
    };
  }
};

export const postTrainerChat = async (
  conversation: any,
  chatId: string
): Promise<{
  success: boolean;
  message: string;
  chatDetails?: any;
  error?: string;
}> => {
  try {
    // Extract userId and trainerId from chatId
    const ids = extractIdsFromChatId(chatId);
    if (!ids) {
      return {
        success: false,
        message: "Invalid chatId format",
        error: "chatId must be in format userId-trainerId",
      };
    }

    const { userId, trainerId } = ids;

    // Check if chat already exists
    const existingChat = await TrainerChatModel.findOne({ chatId });

    if (existingChat) {
      // Determine update type based on role
      const updateFields: any = {
        $push: { conversation },
      };

      if (conversation.role === "user") {
        updateFields.$set = { newUserMessage: true };
      } else {
        updateFields.$set = { newTrainerMessage: true };
      }

      const updatedChat = await TrainerChatModel.findOneAndUpdate(
        { _id: existingChat.id },
        updateFields,
        { new: true }
      );

      // Send notification based on role
      if (conversation.role === "user") {
        // When user sends message, create notification for trainer (no FCM push)
        try {
          const user = await UserModel.findById(userId).select("name");
          await createNotification({
            title: "New Message",
            body: `${user?.name || "User"} sent you a message`,
            trainerId: trainerId,
            userId: userId, // Store userId so trainer can navigate to chat with this user
            isTrainer: true,
            userName: user?.name || "User", // Sender's name (user)
          });
        } catch (error) {
          console.error("Error creating trainer notification:", error);
        }
      } else {
        // When trainer sends message, notify user with FCM and create notification
        try {
          const user = await UserModel.findById(userId);
          const trainer = await UserModel.findById(trainerId).select("name");
          if (user && user.expoPushToken) {
            await sendPushNotifications(
              "New Message",
              `You have a new message from your trainer`,
              [user.expoPushToken],
              { 
                type: "trainer_chat", 
                chatId, 
                trainerId,
                trainerName: trainer?.name || "Trainer"
              }
            );
          }
          // Also create notification in database (trainer already fetched above)
          await createNotification({
            title: "New Message",
            body: `${trainer?.name || "Trainer"} sent you a message`,
            userId: userId,
            isTrainer: false,
            userName: trainer?.name || "Trainer", // Sender's name (trainer)
          });
        } catch (error) {
          console.error("Error sending user notification:", error);
        }
      }

      return {
        success: true,
        message: "Chat has been updated",
        chatDetails: updatedChat,
      };
    } else {
      // Create new chat if it doesn't exist
      const newChatData: any = {
        chatId,
        conversation: [conversation],
        newUserMessage: conversation.role === "user",
        newTrainerMessage: conversation.role === "trainer",
      };

      const newChat = new TrainerChatModel(newChatData);
      const savedChat = await newChat.save();

      // Send notification
      if (conversation.role === "user") {
        // When user sends first message, create notification for trainer (no FCM push)
        try {
          const user = await UserModel.findById(userId).select("name");
          await createNotification({
            title: "New Message",
            body: `${user?.name || "User"} sent you a message`,
            trainerId: trainerId,
            userId: userId, // Store userId so trainer can navigate to chat with this user
            isTrainer: true,
            userName: user?.name || "User", // Sender's name (user)
          });
        } catch (error) {
          console.error("Error creating trainer notification:", error);
        }
      } else {
        // When trainer sends first message, notify user with FCM and create notification
        try {
          const user = await UserModel.findById(userId);
          const trainer = await UserModel.findById(trainerId).select("name");
          if (user && user.expoPushToken) {
            await sendPushNotifications(
              "New Message",
              `You have a new message from your trainer`,
              [user.expoPushToken],
              { 
                type: "trainer_chat", 
                chatId, 
                trainerId,
                trainerName: trainer?.name || "Trainer"
              }
            );
          }
          // Also create notification in database (trainer already fetched above)
          await createNotification({
            title: "New Message",
            body: `${trainer?.name || "Trainer"} sent you a message`,
            userId: userId,
            isTrainer: false,
            userName: trainer?.name || "Trainer", // Sender's name (trainer)
          });
        } catch (error) {
          console.error("Error sending user notification:", error);
        }
      }

      return {
        success: true,
        message: "New chat created",
        chatDetails: savedChat,
      };
    }
  } catch (error: any) {
    console.error("Error in postTrainerChat:", error);
    return {
      success: false,
      message: "Failed to post trainer chat",
      error: error.message || "Unknown error",
    };
  }
};

// Get all chats for a trainer (to show in admin panel)
export const getTrainerChats = async (trainerId: string) => {
  try {
    // Find all chats where chatId ends with the trainerId
    const allChats = await TrainerChatModel.find({}).sort({ updatedAt: -1 });
    
    // Filter chats where trainerId matches
    const trainerChats = allChats.filter((chat) => {
      const ids = extractIdsFromChatId(chat.chatId);
      return ids && ids.trainerId === trainerId;
    });

    // Get user details for each chat
    const chatsWithUserDetails = await Promise.all(
      trainerChats.map(async (chat) => {
        const ids = extractIdsFromChatId(chat.chatId);
        if (ids) {
          const user = await UserModel.findById(ids.userId).select("name profilePic");
          return {
            ...chat.toObject(),
            userId: ids.userId,
            trainerId: ids.trainerId,
            userDetails: user,
          };
        }
        return chat.toObject();
      })
    );

    return {
      message: "Trainer chats found",
      data: chatsWithUserDetails,
      success: true,
    };
  } catch (error: any) {
    return {
      message: `Some error happened ${error.message}`,
      data: [],
      success: false,
    };
  }
};

// Get all chats for a user (to show user's trainer chats)
export const getUserTrainerChats = async (userId: string) => {
  try {
    // Find all chats where chatId starts with the userId
    const allChats = await TrainerChatModel.find({}).sort({ updatedAt: -1 });
    
    // Filter chats where userId matches
    const userChats = allChats.filter((chat) => {
      const ids = extractIdsFromChatId(chat.chatId);
      return ids && ids.userId === userId;
    });

    // Get trainer details for each chat
    const chatsWithTrainerDetails = await Promise.all(
      userChats.map(async (chat) => {
        const ids = extractIdsFromChatId(chat.chatId);
        if (ids) {
          const trainer = await UserModel.findById(ids.trainerId).select("name profilePic");
          return {
            ...chat.toObject(),
            userId: ids.userId,
            trainerId: ids.trainerId,
            trainerDetails: trainer,
          };
        }
        return chat.toObject();
      })
    );

    return {
      message: "User trainer chats found",
      data: chatsWithTrainerDetails,
      success: true,
    };
  } catch (error: any) {
    return {
      message: `Some error happened ${error.message}`,
      data: [],
      success: false,
    };
  }
};
