import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { userOtpVerify } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);
    console.log(req.body, "this is the query from the request");

    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean } = await userOtpVerify(
      req.body.email,
      req.body.otp,
      req.body.expoPushToken
    );
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
        message: "Unable to verify the otp",
        success: false,
        data: null,
      },
    };
  }
};

export default httpTrigger;
