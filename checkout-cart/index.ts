import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import {
  checkIfNormalUser,
  verifyAndDecodeToken,
} from "../src/admin/admin.service";
import { cartCheckout, getCart } from "../src/cart/cart.service";

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

    if (!checkIfNormalUser(userId)) {
      context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }
    console.log(userId);
    // console.log(req.body.phoneNumber);

    // const response: { message: string; success: boolean } = await cartCheckout(
    //   userId,
    //   req.body.phoneNumber
    // );
    const response: { message: string; success: boolean } = await cartCheckout(
      userId
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
