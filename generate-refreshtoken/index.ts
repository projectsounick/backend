import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { fetchWebsiteContent } from "../src/websiteContent/websiteContent.service";
import { WebsiteContent } from "../src/websiteContent/websitecontent.model";
import { generateJWT } from "../src/admin/admin.service";

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
    const jwtToken = generateJWT(req.query.userId);
    if (jwtToken) {
      context.res = {
        status: 200,
        body: {
          message: "Jwt token has been generated successfull",
          accessToken: jwtToken,
          success: true,
        },
      };
    } else {
      context.res = {
        status: 500,
        body: {
          message: "Unable to generate the jwt token",
          accessToken: jwtToken,
          success: false,
        },
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
