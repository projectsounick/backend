import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { createBlog } from "../src/Blogs/blogs.service";
import { Blog } from "../src/Blogs/blogs.model";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import { addUserPodcastInteraction } from "../src/Podcast/podcast.service";
import { postUserNotifications } from "../src/AdminNotification/adminNotificationService";
import { addExercise } from "../src/workout/workout.service";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);
    let userId: string;
    const authResponse = verifyAndDecodeToken(req);
    if (authResponse) {
      userId = authResponse;
    } else {
      context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }
    /// replace this query _id with jsonwebtoken _id later on

    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean; data: any } =
      await addExercise(req.body);
    if (response.success) {
      context.res = {
        status: 200,
        body: response,
      };
    } else {
      context.res = {
        status: 500,
        body: response,
      };
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: `${error.message}`,
        success: false,
      },
    };
  }
};

export default httpTrigger;
