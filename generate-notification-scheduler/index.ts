import { AzureFunction, Context } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import UserModel from "../src/users/user.model";
import axios from "axios";

const sendNotification = async (
  batch: string[],
  title: string,
  body: string
) => {
  try {
    await axios.post("http://localhost:7071/api/send-automated-notification", {
      tokens: batch,
      title,
      body,
    });
  } catch (error) {
    console.error("Error sending batch:", error);
  }
};

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const now = new Date();
  const currentUTCHour = now.getUTCHours(); // Always in UTC

  if (myTimer.isPastDue) {
    context.log("Timer function is running late!");
  }

  let title = "";
  let body = "";

  if (currentUTCHour === 4 || currentUTCHour === 8) {
    // Morning notification
    title = "Hydration Check-In 💧";
    body =
      "🚰 Time for a water break! Aim to hydrate at least 4 times a day. Your body (and brain!) will thank you. Cheers to your health!";
  } else if (currentUTCHour === 12 || currentUTCHour === 16) {
    // Evening notification
    title = "Steps Reminder 🏃‍♂️";
    body =
      "Keep moving! Make sure you’re getting your steps in today. Every step counts toward a healthier you!";
  }

  if (title && body) {
    await init(context);

    const usersWithExpoPushToken = await UserModel.find({
      expoPushToken: { $nin: [null, ""] },
    }).select("expoPushToken");

    const tokens = usersWithExpoPushToken.map((user) => user.expoPushToken);

    const batchSize = 70;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      await sendNotification(batch, title, body);
    }

    context.log(
      `Sent ${tokens.length} notifications for ${title} at ${now.toISOString()}`
    );
  } else {
    context.log(
      `Function ran at ${now.toISOString()} — no notification to send.`
    );
  }
};

export default timerTrigger;
