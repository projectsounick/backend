import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { addTrainer } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    await init(context);
    // const response: { message: string; success: boolean } = await getAllTrainers(req.query);
    const response :any={};
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
