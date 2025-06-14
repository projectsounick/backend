import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("📩 PhonePe callback received");

  try {
    const { merchantOrderId, transactionId, status, code, message } = req.body;

    context.log("✅ Parsed Payload:", {
      merchantOrderId,
      transactionId,
      status,
      code,
      message,
    });

    // TODO: Optional - Store or process this in your DB
    // Example: await db.savePaymentStatus({ merchantOrderId, transactionId, status });

    context.res = {
      status: 200,
      body: "Callback received",
    };
  } catch (error) {
    context.log("❌ Error in callback handler:", error);

    // Still return 200 so PhonePe considers it successful
    context.res = {
      status: 200,
      body: "Callback received with errors",
    };
  }
};

export default httpTrigger;
