import twilio from "twilio";
import { checkUserExists } from "../admin/admin.service";
import { removeCountryCode } from "../utils/usersUtils";

///// Function for sending SMS using Twilio API /////----/
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

export async function sendOtpUsingTwilio(
  phoneNumber: string,
  userId: string
): Promise<{ message: string; success: boolean }> {
  const userExists = await checkUserExists(userId);

  if (userExists === false) {
    throw new Error("User does not exist.");
  }
  if (!phoneNumber) {
    throw new Error("Phone number is required.");
  }

  try {
    const client = twilio(accountSid, authToken);
    console.log("this is client");
    console.log(client);

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: phoneNumber, channel: "sms" });
    console.log(verification);

    if (verification.status === "pending") {
      // OTP was sent successfully and is waiting for user input
      console.log("OTP sent successfully!");
      return { message: "OTP sent successfully!", success: true };
    } else {
      throw new Error("Failed to send OTP.");
    }
  } catch (error: any) {
    console.error("Error in sendOtp service:", error);
    throw new Error(error.message || "Failed to send OTP.");
  }
}
