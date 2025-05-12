import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  loginUser,
  updateUserData,
  userOtpVerify,
} from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    // Verify token and extract user ID
    const userId = verifyAndDecodeToken(req);

    if (!userId) {
      context.res = {
        status: 401,
        body: {
          message: "You are not authenticated",
          success: false,
        },
      };
      return;
    }

    /// Building connection with the cosmos database -----------------/
    await init(context);
    console.log(req.body.data);

    /// replace this query _id with jsonwebtoken _id later on

    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean } =
      await updateUserData(userId, req.body.data);

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
    console.log(`went for catch ${error.message}`);

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
