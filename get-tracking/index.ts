import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import {
  getSleepTracking,
  getWalkTracking,
  getWaterTracking,
} from "../src/tracking/tracking.service";

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
    const { startDate, endDate, id } = req.query;
    const trackingType = req.params.type;

    let response: { message: string; success: boolean };
    const finalUserId = id || userId;
    console.log("this is finaluserId");
    console.log(finalUserId);

    if (trackingType === "sleep") {
      response = await getSleepTracking(finalUserId, startDate, endDate);
    } else if (trackingType === "walk") {
      response = await getWalkTracking(finalUserId, startDate, endDate);
    } else if (trackingType === "water") {
      response = await getWaterTracking(finalUserId, startDate, endDate);
    }
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
