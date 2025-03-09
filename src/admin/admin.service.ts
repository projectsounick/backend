import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

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
