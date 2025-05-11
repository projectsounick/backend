import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import { AddOrUpdateSleepTracking, AddOrUpdateWalkTracking, AddOrUpdateWaterTracking } from "../src/tracking/tracking.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    let userId: string;
    const authResponse = await verifyAndDecodeToken(req);
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
    const { value, date } = req.body;
    const trackingType = req.params.type;

    let response: { message: string; success: boolean };

    if(trackingType === "sleep") {
      response = await AddOrUpdateSleepTracking(userId, value, date);
    }else if(trackingType === "walk") {
      response = await AddOrUpdateWalkTracking(userId, value, date);
    }else if(trackingType === "water") {
      response = await AddOrUpdateWaterTracking(userId, value, date);
    }

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
