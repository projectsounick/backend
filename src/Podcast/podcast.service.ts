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
