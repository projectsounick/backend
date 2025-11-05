import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import mongoose from "mongoose";
import {
  addWeight,
  deleteWeight,
  getWeights,
} from "../src/weight/weight.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";

// ✅ Mongo connection (cache for Azure)
let conn: typeof mongoose | null = null;

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
) => {
  try {
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
    console.log("this is");
    console.log(userId);
    const method = req.method.toLowerCase();
    const action = req.query.action || req.body?.action;

    let result;
    console.log(req.body);
    if (action === "get") {
      result = await getWeights(userId);
    } else if (action === "add") {
      result = await addWeight(userId, req.body.data);
    } else if (action === "delete") {
      console.log(req.query.weightId);
      result = await deleteWeight(userId, req.query.weightId);
    } else {
      result = { success: false, message: "Invalid method or action" };
    }

    context.res = {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
      body: result,
    };
  } catch (error: any) {
    context.res = {
      status: 500,
      body: { success: false, message: error.message },
    };
  }
};

export default httpTrigger;
