import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { loginUser, userOtpVerify } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<{
  message: string;
  success: boolean;
}> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init();

    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean } = await userOtpVerify(
      req.query.otp,
      req.query._id
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
    return {
      message: `${error.message}`,
      success: false,
    };
  }
};

export default httpTrigger;
