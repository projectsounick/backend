import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { googleSignIn } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

//// Main Google Sign-In function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);

    const { idToken, expoPushToken } = req.body;

    if (!idToken) {
      context.res = {
        status: 400,
        body: {
          message: "ID token is required",
          success: false,
        },
      };
      return;
    }

    /// Calling the service function ----------------------/
    const response = await googleSignIn(idToken, expoPushToken);

    if (response.success) {
      context.res = {
        status: 200,
        body: response,
      };
    } else {
      context.res = {
        status: 400,
        body: response,
      };
    }
  } catch (error: any) {
    context.res = {
      status: 500,
      body: {
        message: `Google sign-in error: ${error.message}`,
        success: false,
      },
    };
  }
};

export default httpTrigger;

