import crypto from "crypto";
const axios = require("axios");

const PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = process.env.CLIENT_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const SALT_KEY = process.env.CLIENT_SECRET; // a.k.a saltKey
console.log(MERCHANT_ID);
console.log(SALT_KEY);

const SALT_INDEX = "1"; // Default for sandbox; get actual index in prod

const generateMerchantTransactionId = (userId) => {
  const now = new Date();

  // Format date/time as YYYYMMDDHHMMSS (year, month, day, hour, minute, second)
  const formattedDate = now
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14); // YYYYMMDDHHMMSS

  // Combine with userId (or part of it) to form unique ID
  return `TXN_${userId}_${formattedDate}`;
};

export async function getPhonePeUrl(amount: any, userId: any) {
  try {
    const redirectUrl = "myapp://payment-success";
    const callbackUrl = "https://your-backend.com/api/payment-callback"; // optional
    const merchantTransactionId = generateMerchantTransactionId(userId);
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // in paise
      redirectUrl,
      redirectMode: "POST",
      mobileNumber: "8240765325",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    console.log(payload);

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );

    const stringToSign = base64Payload + "/pg/v1/pay" + SALT_KEY;
    const xVerify =
      crypto.createHash("sha256").update(stringToSign).digest("hex") +
      "###" +
      SALT_INDEX;
    console.log("went till here");

    const response = await axios.post(
      `${PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": MERCHANT_ID,
        },
      }
    );
    console.log(response);

    const { data } = response.data;

    return {
      success: true,
      message: "Payment URL generated successfully",
      paymentUrl: data.instrumentResponse.redirectInfo.url,
      merchantTransactionId,
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: error.message || "Failed to generate payment URL",
    };
  }
}
