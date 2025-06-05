import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { getUserRole, verifyAndDecodeToken } from "../src/admin/admin.service";
import { getPaymentItems } from "../src/payment/payment.service";
import { getPhonePeUrl } from "../src/payment/phonepe.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    // let callingUserId: string;
    // const authResponse = await verifyAndDecodeToken(req);
    // if (authResponse) {
    //   callingUserId = authResponse;
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

    const response: { message: string; success: boolean } = await getPhonePeUrl(
      req.body.amount,
      req.body.id
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
        message: `${error.message}`,
        success: false,
      },
    };
  }
};

export default httpTrigger;
