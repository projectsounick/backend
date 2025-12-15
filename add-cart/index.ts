import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import {
  checkIfNormalUser,
  verifyAndDecodeToken,
} from "../src/admin/admin.service";
import { addCart } from "../src/cart/cart.service";
import { createNotification } from "../src/Notification/notification.service";

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

    try {
      createNotification({
        title: "Product adding",
        body: "User has added a product to the cart",
        userId: userId,
        isAdmin: true,
      });
    } catch (error) {}
    console.log("went past this");

    const response: { message: string; success: boolean } = await addCart(
      userId,
      req.body
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
    console.log(error.message);

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
