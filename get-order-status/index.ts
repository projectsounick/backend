import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { checkIfAdmin, verifyAndDecodeToken } from "../src/admin/admin.service";
import { updatePlan } from "../src/Plans/plan.service";
import { getUpdatePaymentStatus } from "../src/payment/payment.service";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    // let userId: string;
    // const authResponse = await verifyAndDecodeToken(req);
    // if (authResponse) {
    //   userId = authResponse;
    // } else {
    //   context.res = {
    //     status: 401,
    //     body: {
    //       message: "Unauthorized",
    //       success: false,
    //     },
    //   };
    //   return;
    // }
    // await init(context);

    const orderId = req.params.orderId;
    const response: { message: string; success: boolean } =
      await getUpdatePaymentStatus(orderId);
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
