import mongoose from "mongoose";
import PodcastModel, { Podcast } from "./podcast.model";
import { sendBulkPushNotificationsAndSave } from "../Notification/notification.service";
import UserModel from "../users/user.model";

///// Function for fetching the podcasts -------------------------------------/
export async function fetchPodcasts(
  lastId?: string,
  limit?: string
): Promise<{
  message: string;
  success: boolean;
  data: Podcast[];
  hasMore: boolean;
  lastId?: string;
}> {
  try {
    // Select only needed fields to reduce data transfer
    // Note: interactions is included for comments display, but it's an array so be mindful of size
    const selectFields = "podcastName podcastLink category thumbnailImageLink description likes interactions createdAt updatedAt";
    
    // Parse limit, default to 4 for initial load, 20 for subsequent loads
    const parsedLimit = limit ? parseInt(limit, 10) : (lastId ? 20 : 4);
    const itemsPerPage = parsedLimit > 0 ? parsedLimit : (lastId ? 20 : 4);

    // Build query - if lastId is provided, fetch podcasts created before that ID
    const query: any = {};
    if (lastId) {
      try {
        const lastObjectId = new mongoose.Types.ObjectId(lastId);
        // Fetch the last podcast to get its createdAt timestamp
        const lastPodcast = await PodcastModel.findById(lastObjectId).select("createdAt").lean();
        if (lastPodcast && lastPodcast.createdAt) {
          // Query for podcasts with createdAt less than the last one
          query.createdAt = { $lt: new Date(lastPodcast.createdAt) };
        } else {
          // Fallback: use _id comparison (ObjectIds contain timestamp info)
          query._id = { $lt: lastObjectId };
        }
      } catch (error) {
        // If lastId is invalid, just ignore it and fetch from start
        console.warn("Invalid lastId provided, fetching from start:", error);
      }
    }

    // Fetch one extra to check if there are more items
    // Sort by createdAt descending (newest first) - newest podcasts appear first
    const podcasts = await PodcastModel.find(query)
      .select(selectFields)
      .sort({ id: -1 }) // Sort by newest first (descending)
      .limit(itemsPerPage + 1) // Fetch one extra to check hasMore
      .lean();

    // Check if there are more items
    const hasMore = podcasts.length > itemsPerPage;
    
    // Remove the extra item if it exists
    const resultPodcasts = hasMore ? podcasts.slice(0, itemsPerPage) : podcasts;
    
    // Get the last ID for next page - always set it if we have results
    let newLastId: string | undefined = undefined;
    if (resultPodcasts.length > 0) {
      const lastPodcast = resultPodcasts[resultPodcasts.length - 1];
      // Ensure we get the _id properly - handle both ObjectId and string formats
      if (lastPodcast && (lastPodcast as any)._id) {
        const lastIdValue = (lastPodcast as any)._id;
        // Convert to string if it's an ObjectId, otherwise use as is
        newLastId = typeof lastIdValue === 'string' 
          ? lastIdValue 
          : lastIdValue.toString();
      }
    }

    // Log for debugging
    console.log(`Fetched ${resultPodcasts.length} podcasts, hasMore: ${hasMore}, lastId: ${newLastId}`);

    return {
      message: "Podcasts has been fetched",
      success: true,
      data: resultPodcasts as Podcast[],
      hasMore,
      lastId: newLastId,
    };
  } catch (error) {
    throw new Error(`unable to fetch the podcasts ${error.message}`);
  }
}

//// Function for creating new podcast --------------------------------------------/
export async function createPodcast(data: Podcast): Promise<{
  message: string;
  success: boolean;
  data: Podcast;
}> {
  try {
    const dataToSave = new PodcastModel(data);
    let response = await dataToSave.save();

    // Send notification to all users about new podcast
    try {
      // Fetch ALL users (not just those with push tokens)
      // This ensures notifications are saved in DB for all users
      const allUsers = await UserModel.find({}).select("_id expoPushToken").lean();

      if (allUsers.length > 0) {
        const adminId = "6824c9555c0f5d5253ed8d3f";
        const usersWithSenderId = allUsers.map((user) => ({
          ...user,
          senderId: adminId,
        }));

        await sendBulkPushNotificationsAndSave(
          "New Podcast Available!",
          `Check out our latest podcast: ${data.podcastName}`,
          usersWithSenderId,
          "user",
          {
            type: "podcast",
            navigationData: {
              screen: "/dashboard/media",
              params: {},
            },
          }
        );
        
        console.log(`Podcast notification sent to ${allUsers.length} users`);
      } else {
        console.log("No users found to send podcast notification");
      }
    } catch (notificationError) {
      console.error("Error sending podcast notification:", notificationError);
      // Don't fail podcast creation if notification fails
    }

    return {
      message: "Podcast has been Created",
      success: true,
      data: response,
    };
  } catch (error) {
    throw new Error(`unable to fetch the podcasts ${error.message}`);
  }
}

///// Function for adding the interaction from user side ------------------------------/
export async function addUserPodcastInteraction(
  userId: string,
  data: { podcastId: string; comment: string; userName: string }
): Promise<{
  message: string;
  success: boolean;
  data: Podcast;
}> {
  try {
    //// adding the comment or like into the podcast-----------------/

    const podcastId = new mongoose.Types.ObjectId(data.podcastId);
    const podcast = await PodcastModel.findById(podcastId);

    if (!podcast) {
      throw new Error("Podcast not found");
    }
    console.log("thiis userId");
    console.log(userId);

    const hasLiked = podcast.likes.includes(userId);

    const updates: any = {};

    if (hasLiked) {
      updates.$pull = { likes: userId };
    } else {
      console.log("went for else");

      updates.$addToSet = { likes: userId };
    }

    if (data.comment && data.comment.trim() !== "") {
      updates.$push = {
        interactions: {
          userId,
          userName: data.userName, // Replace with real userName if you have it
          comment: data.comment,
        },
      };
    }
    console.log(updates);
    const updatedPodcast = await PodcastModel.findByIdAndUpdate(
      podcastId,
      updates,
      { new: true }
    );

    return {
      message: "Podcast interaction updated",
      success: true,
      data: updatedPodcast,
    };
  } catch (error) {
    throw new Error(`unable to fetch the podcasts ${error.message}`);
  }
}
