import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { loginUser } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);

    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean } = await loginUser(
      req.body.phoneNumber
    );

    if (response.success) {
      context.res = {
        status: 200,
        body: response,
      };
    } else {
      context.res = {
        status: 200,
        body: response,
      };
    }
  } catch (error) {
    console.log(error.message);

    context.res = {
      status: 500,
      body: {
        message: `some error has happend${error.message}`,
        success: false,
      },
    };
  }
};

export default httpTrigger;
