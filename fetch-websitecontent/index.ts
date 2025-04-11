import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getUserData,
  loginUser,
  updateUserData,
  userOtpVerify,
} from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { fetchWebsiteContent } from "../src/websiteContent/websiteContent.service";
import { WebsiteContent } from "../src/websiteContent/websitecontent.model";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);

    /// replace this query _id with jsonwebtoken _id later on

    /// Calling the service function ----------------------/
    const response: {
      message: string;
      success: boolean;
      data: WebsiteContent;
    } = await fetchWebsiteContent();
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
