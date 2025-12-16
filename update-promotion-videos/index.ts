import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import {
  checkIfAdmin,
  updatePromotionVideosJson,
  verifyAndDecodeToken,
} from "../src/admin/admin.service";
import { updatePlanType } from "../src/Plans/plan.service";
import { sendNotificationToALLUser } from "../src/Notification/notification.service";
import { getVersionUpdateNotificationContent } from "../src/utils/staticNotificaitonContent";

//// Main login function ------------------------------------------------------------------------------/
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

    if (!checkIfAdmin(userId)) {
      context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }

    // Check if this is a version file update
    const isVersionFile = req.body.blobName === "androidVersion.json" || req.body.blobName === "iosVersion.json";
    let newVersion: string | null = null;
    let platform: string = "";

    if (isVersionFile && Array.isArray(req.body.fileData) && req.body.fileData.length > 0) {
      const latestEntry = req.body.fileData[0];
      if (typeof latestEntry === "string") {
        newVersion = latestEntry;
      } else if (latestEntry && typeof latestEntry === "object" && latestEntry.version) {
        newVersion = latestEntry.version;
      }
      platform = req.body.blobName === "androidVersion.json" ? "Android" : "iOS";
      console.log(`[Version Update] Detected ${platform} version update: ${newVersion}`);
    }

    let response = await updatePromotionVideosJson(req.body);
    
    // Send notification after successful update (database is already initialized)
    if (response.success && isVersionFile && newVersion) {
      try {
        // Get notification content from centralized location
        const notificationContent = getVersionUpdateNotificationContent(platform, newVersion);
        
        console.log(`[Version Update] Sending notification to all users for ${platform} version ${newVersion}`);
        
        // Send notification - database is already initialized
        const notificationResult = await sendNotificationToALLUser(
          notificationContent.title,
          notificationContent.body
        );
        
        console.log(`[Version Update] Notification result:`, notificationResult);
      } catch (notificationError) {
        console.error("[Version Update] Error sending notification:", notificationError);
        // Don't fail the main operation if notification fails
      }
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
