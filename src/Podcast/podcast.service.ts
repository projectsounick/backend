import mongoose from "mongoose";
import PodcastModel, { Podcast } from "./podcast.model";

///// Function for fetching the podcasts -------------------------------------/
export async function fetchPodcasts(): Promise<{
  message: string;
  success: boolean;
  data: Podcast[];
}> {
  try {
    const response = await PodcastModel.find({});
    return {
      message: "Podcasts has been fetched",
      success: true,
      data: response,
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
