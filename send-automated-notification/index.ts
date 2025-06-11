import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Expo } from "expo-server-sdk";

// Create an Expo SDK client
const expo = new Expo();

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const { title, body, tokens } = req.body;

  if (!title || !body || !Array.isArray(tokens) || tokens.length === 0) {
    context.res = {
      status: 400,
      body: "❌ Request must include title, body, and a non-empty tokens array",
    };
    return;
  }

  const messages = [];
  const errors = [];

  for (const token of tokens) {
    if (!Expo.isExpoPushToken(token)) {
      errors.push({
        token,
        error: "Invalid Expo push token",
      });
      continue;
    }

    messages.push({
      to: token,
      sound: "default",
      title,
      body,
      data: { withSome: "data" }, // You can customize this payload
    });
  }

  if (messages.length === 0) {
    context.res = {
      status: 400,
      body: {
        message: "❌ No valid tokens found",
        errors,
      },
    };
    return;
  }

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    context.res = {
      status: 200,
      body: {
        message: "✅ Notifications sent successfully",
        tickets,
        errors: errors.length ? errors : undefined,
      },
    };
  } catch (error) {
    context.log("❌ Error sending notifications:", error);
    context.res = {
      status: 500,
      body: "❌ Failed to send notifications",
    };
  }
};

export default httpTrigger;
