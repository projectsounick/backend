import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import { getHealthSyncStatus, syncHealthData, disableHealthSync } from "../src/tracking/healthSync.service";


/**
 * Generic Health Data Sync Endpoint
 * Supports both iOS (Apple Health) and Android (Google Fit)
 */
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    // Authenticate user
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
    
    const { action, data, platform } = req.body;

    // Validate platform
    const validPlatforms = ["ios", "android"];
    const platformType = platform || "ios"; // Default to iOS
    
    if (!validPlatforms.includes(platformType)) {
      context.res = {
        status: 400,
        body: {
          message: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}`,
          success: false,
        },
      };
      return;
    }

    if (action === "sync") {
      // Sync health data
      if (!data || (!data.steps && !data.sleep)) {
        context.res = {
          status: 400,
          body: {
            message: "Missing data. Provide steps and/or sleep data.",
            success: false,
          },
        };
        return;
      }

      const response = await syncHealthData(userId, data, platformType);

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
    } else if (action === "status") {
      // Get sync status
      const response = await getHealthSyncStatus(userId);
      console.log("it is response sync", response);
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
    } else if (action === "disable") {
      // Disable sync for a specific type
      const { type } = req.body;
      
      if (!type || (type !== "steps" && type !== "sleep")) {
        context.res = {
          status: 400,
          body: {
            message: "Invalid type. Must be 'steps' or 'sleep'",
            success: false,
          },
        };
        return;
      }

      const response = await disableHealthSync(userId, type);
      
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
        status: 400,
        body: {
          message: "Invalid action. Use 'sync', 'status', or 'disable'",
          success: false,
        },
      };
    }
  } catch (error: any) {
    console.error("[HealthSync] Endpoint error:", error);
    context.res = {
      status: 500,
      body: {
        message: error.message || "Internal server error",
        success: false,
      },
    };
  }
};

export default httpTrigger;
