import {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  SASProtocol,
} from "@azure/storage-blob";
import jwt from "jsonwebtoken";
import UserModel from "../users/user.model";
import axios from "axios";
////// Function for generating the sastoken -------------------------------------/
/// takes container name and generate sastoken for accessing that ----/
export function generateSasToken(folderName: string, contName?: string) {
  try {
    // ✅ Load Storage Account credentials from environment variables
    const storageAccountName = process.env.storageAccountName;
    const storageAccountKey = process.env.inessStorageAccountKey;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      storageAccountName,
      storageAccountKey
    );

    const sasOptions = {
      containerName: contName ? contName : "admin-data",
      blobNameStartsWith: `${folderName}/`,
      permissions: BlobSASPermissions.parse("rwd"), // Read and write permissions
      expiresOn: new Date("2099-12-31"),
    };
    console.log("this is sasoptions");

    console.log(sasOptions);

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
export function generateSasTokenForAnyContainer(
  blobPath: string, // full blob path e.g., "folder/file.jpg" or "file.jpg"
  containerName: string
) {
  try {
    const storageAccountName = process.env.storageAccountName!;
    const storageAccountKey = process.env.inessStorageAccountKey!;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      storageAccountName,
      storageAccountKey
    );
    // ⏱️ Set expiry time to 10 minutes from now
    const expiresOn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const sasOptions = {
      containerName,
      blobName: blobPath, // can be 'file.jpg' or 'folder/file.jpg'
      permissions: BlobSASPermissions.parse("rwd"), // Read, Write, Delete
      expiresOn: expiresOn,
      protocol: SASProtocol.HttpsAndHttp,
    };
    console.log("this are sasoptions");
    console.log(sasOptions);

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    return sasToken;
  } catch (error) {
    throw new Error("Unable to generate the SAS token");
  }
} //// Function to verify and decode JWT token ----------------------------------/
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
  const token = jwt.sign(payload, secretKey, { expiresIn: "23h" });
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
import mongoose from "mongoose";
import CommunityModel, { Community } from "../community/community.model";

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

///// Funciton to  update video promotion json file -------------------------------------------/
export async function updatePromotionVideosJson({
  fileData,
  containerName,
  blobName,
}: any) {
  try {
    console.log(fileData);

    // 1. Generate SAS token
    const sasToken = generateSasTokenForAnyContainer(blobName, containerName);

    // 2. Construct full blob URL with SAS
    const blobUrl = `https://inessstorage.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;

    // 3. Upload JSON using PUT request
    const response = await axios.put(blobUrl, JSON.stringify(fileData), {
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201) {
      return {
        success: true,
        message: "Promotion Videos.json updated successfully",
      };
    } else {
      return {
        success: false,
        message: `Unexpected status code: ${response.status}`,
      };
    }
  } catch (error: any) {
    console.log(error.message);

    return {
      success: false,
      message: error.message || "Failed to upload promotionVideos.json",
    };
  }
}

export const createDefaultCommunityFromUsers = async (): Promise<{
  success: boolean;
  message: string;
  data?: Community;
}> => {
  try {
    const allUsers = await UserModel.find({}, "_id role");

    const members: any[] = [];
    const admins: any[] = [];

    for (const user of allUsers) {
      if (user.role === "admin") {
        admins.push(user._id);
      } else if (user.role === "trainer" || user.role === "user") {
        members.push(user._id);
      }
    }

    const community = await CommunityModel.create({
      name: "Iness Fitness Hub",
      members,
      admins,
      isCorporate: false,
      isDefault: true,
    });

    return {
      success: true,
      message: "Default community created successfully",
      data: community,
    };
  } catch (error) {
    console.error("Error creating community:", error);
    return {
      success: false,
      message: "Failed to create community",
    };
  }
};



///// Function for the content complain ------------------------------------/
async function addContentComplain(){
  
}