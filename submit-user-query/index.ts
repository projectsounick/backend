import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { storeUserQuery } from "../src/userQuery/userquery.service";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);

    /// replace this query _id with jsonwebtoken _id later on
    context.log(req.body);

    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean } =
      await storeUserQuery(req.body, context);
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
