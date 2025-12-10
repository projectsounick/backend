import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { Podcast } from "../src/Podcast/podcast.model";
import { fetchPodcasts } from "../src/Podcast/podcast.service";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);

    /// Get cursor-based pagination parameters from query string
    const { lastId, limit } = req.query;
console.log("lastId");
console.log(lastId);
console.log("limit");
console.log(limit);
    /// Calling the service function ----------------------/
    const response = await fetchPodcasts(lastId as string, limit as string);
 console.log("response");
 console.log(response);
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
