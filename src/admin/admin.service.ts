import {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import jwt from "jsonwebtoken";
import UserModel from "../users/user.model";
import axios from "axios";
////// Function for generating the sastoken -------------------------------------/
/// takes container name and generate sastoken for accessing that ----/
export function generateSasToken(folderName: string) {
  try {
    // ✅ Load Storage Account credentials from environment variables
    const storageAccountName = process.env.storageAccountName;
    const storageAccountKey = process.env.inessStorageAccountKey;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      storageAccountName,
      storageAccountKey
    );

    const sasOptions = {
      containerName: "admin-data",
      blobNameStartsWith: `${folderName}/`,
      permissions: BlobSASPermissions.parse("rwd"), // Read and write permissions
      expiresOn: new Date("2099-12-31"),
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    return sasToken;
    return sasToken;
  } catch (error) {
    throw new Error("Unable to generate the sastoken");
  }
}

//// Function to verify and decode JWT token ----------------------------------/
export function verifyAndDecodeToken(req: any): string | null {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return null;
    }

    // Extract the token (e.g., "Bearer <token>")
    const token = authHeader.split(" ")[1];
    console.log("this is token");
    console.log(token);

    // Secret key for JWT verification (ensure this is the same as used during token generation)
    const secretKey = process.env.secretKey!;

    // Verify and decode the JWT token
    const decodedToken = jwt.verify(token, secretKey) as { _id: string };
    if (decodedToken._id) {
      // Return the user ID (_id) if token is valid
      return decodedToken._id;
    } else return null;
  } catch (error) {
    // Return null if the token is invalid or expired
    return null;
  }
}

//// Function to check if a user exists in the database ---------------------/
export async function checkUserExists(userId: string): Promise<boolean> {
  try {
    // Query the database to find the user by userId
    const user = await UserModel.findById(userId);

    // If user is found, return true, else false
    return user !== null;
  } catch (error) {
    // If there's any error with the database query, log the error and return false
    console.error("Error checking user existence:", error);
    return false;
  }
}

//// Function for generating the jwt-------------------------------/
export function generateJWT(userId: string): string {
  const payload = {
    _id: userId,
  };

  const secretKey = process.env.secretKey!;
  const token = jwt.sign(payload, secretKey, { expiresIn: "5h" });
  return token;
}

export async function sendOtpUsingTwilio(
  userId: string,
  phoneNumber: string
): Promise<boolean> {
  try {
    // Generate JWT token with the userId
    const token = generateJWT(userId);

    // Make the API call to the Azure Function
    const response = await axios.post(
      "http://localhost:7071/api/send-twilio-message",
      { phoneNumber }, // Phone number in the body
      {
        headers: {
          Authorization: `Bearer ${token}`, // Pass JWT in the Authorization header
        },
      }
    );

    // Check if the response is successful
    if (response.data.success) {
      return true; // OTP sent successfully
    } else {
      return false; // Something went wrong
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false; // Return false if there's an error
  }
}

//// Function to get a user role ---------------------/
export async function getUserRole(
  userId: string
): Promise<{ status: boolean; role?: string }> {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return { status: false };
    }
    return { status: true, role: user.role };
  } catch (error) {
    console.error("Error checking user existence:", error);
    return { status: false };
  }
}

//// Function to check if a user is admin ---------------------/
export async function checkIfAdmin(userId: string): Promise<boolean> {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return false;
    }
    if (user.role === "admin") {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
}

//// Function to check if a user is normal user ---------------------/
export async function checkIfNormalUser(userId: string): Promise<boolean> {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return false;
    }
    if (user.role === "user") {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
}
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

export async function uploadSlotsJson(
  slots: string[],
  fileName: string
): Promise<any> {
  try {
    const folderName = "Jsons";
    const sasToken = await generateSasToken(folderName); // assumes this returns a valid SAS
    const storageAccountName = process.env.storageAccountName;

    if (!sasToken || !storageAccountName) {
      throw new Error("Azure storage account or SAS token is missing in env.");
    }

    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net?${sasToken}`
    );

    const containerClient: ContainerClient =
      blobServiceClient.getContainerClient("admin-data");

    // Store the file inside the "Jsons/" folder in the container
    const blobClient = containerClient.getBlockBlobClient(
      `${folderName}/${fileName}`
    );

    const data = JSON.stringify({ slots });
    console.log("this is data");
    console.log(slots);

    const exists = await blobClient.exists();

    await blobClient.upload(data, Buffer.byteLength(data), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });

    return {
      message: "Data has been uploaded",
      success: true,
    };
  } catch (err) {
    console.error("Error uploading JSON to Azure Blob:", err);
    throw err;
  }
}
