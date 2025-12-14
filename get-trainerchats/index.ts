import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import { getTrainerChats } from "../src/TrainerChat/trainerchat.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    let trainerId: string;
    const authResponse = await verifyAndDecodeToken(req);

    if (authResponse) {
      trainerId = authResponse;
    } else {
      context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }

    await init(context);
    
    // If trainerId is provided in params, use it; otherwise use authenticated user
    const paramTrainerId = req.params.trainerId;
    const finalTrainerId = paramTrainerId || trainerId;

    let response = await getTrainerChats(finalTrainerId);

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
  } catch (error: any) {
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
