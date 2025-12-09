import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { appleSignIn } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

//// Main Apple Sign-In function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);

    const { identityToken, userIdentifier, email, fullName, expoPushToken } = req.body;

    if (!identityToken || !userIdentifier) {
      context.res = {
        status: 400,
        body: {
          message: "Identity token and user identifier are required",
          success: false,
        },
      };
      return;
    }

    /// Calling the service function ----------------------/
    const response = await appleSignIn(
      identityToken,
      userIdentifier,
      email,
      fullName,
      expoPushToken
    );

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
        message: `Apple sign-in error: ${error.message}`,
        success: false,
      },
    };
  }
};

export default httpTrigger;

