import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import mongoose from "mongoose";
import { addStreakForUser } from "../src/Streak/streak.services";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
) => {
  await init(context);

  let userId: string;
  const authResponse = verifyAndDecodeToken(req);
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

  const result = await addStreakForUser(userId);
  context.res = {
    status: result.success ? 200 : 500,
    body: result,
  };
};

export default httpTrigger;
