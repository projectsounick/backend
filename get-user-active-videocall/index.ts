import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import {
  getSleepTracking,
  getWalkTracking,
  getWaterTracking,
} from "../src/tracking/tracking.service";
import { getTransformationImagesByUserId } from "../src/TransformationImages.tsx/transformationImages.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    let userId: string;
    const authResponse = await verifyAndDecodeToken(req);
    console.log("this is authreposne");
    console.log(authResponse);

    if (authResponse) {
      userId = authResponse;
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
    console.log("this is userId");
    console.log(userId);

    let response = await getTransformationImagesByUserId(userId);
    console.log(response);
    console.log(response);

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
