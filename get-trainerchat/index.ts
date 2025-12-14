import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import { getTrainerChat, postTrainerChat } from "../src/TrainerChat/trainerchat.service";

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
    const chatId = req.params.chatId;

    if (!chatId) {
      context.res = {
        status: 400,
        body: {
          message: "Chat ID is required",
          success: false,
        },
      };
      return;
    }

    // Handle GET request - fetch chat
    if (req.method === "GET") {
      let response = await getTrainerChat(chatId);

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
    }
    // Handle POST request - add message
    else if (req.method === "POST") {
      if (!req.body || !req.body.data) {
        context.res = {
          status: 400,
          body: {
            message: "Message data is required",
            success: false,
          },
        };
        return;
      }

      let response = await postTrainerChat(req.body.data, chatId);

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
    } else {
      context.res = {
        status: 405,
        body: {
          message: "Method not allowed",
          success: false,
        },
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
