import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { generateSasToken } from "../admin/admin.service";

/**
 * Delete all blobs under a given folder path inside a container
 * @param containerClient - Azure ContainerClient instance
 * @param folderPath - Folder path prefix (e.g., "receiptPdf/userId/")
 */
async function deleteUserFolder(
  containerClient: ContainerClient,
  folderPath: string
) {
  console.log(`Deleting blobs under folder: ${folderPath}`);

  for await (const blob of containerClient.listBlobsFlat({
    prefix: folderPath,
  })) {
    console.log(`Deleting blob: ${blob.name}`);
    await containerClient.deleteBlob(blob.name);
  }
}

/**
 * Upload PDF buffer to Azure Blob Storage at given blob name
 * @param containerClient - Azure ContainerClient instance
 * @param blobName - Full path including "folders" and filename e.g. "receiptPdf/userId/receipt.pdf"
 * @param pdfBuffer - PDF file buffer
 */
async function uploadPdf(
  containerClient: ContainerClient,
  blobName: string,
  pdfBuffer: Buffer
) {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(pdfBuffer, {
      blobHTTPHeaders: { blobContentType: "application/pdf" },
    });
    return blockBlobClient.url;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Main function to delete old user folder and upload new PDF
 * using SAS token
 * @param sasUrl - full container SAS URL (e.g. https://account.blob.core.windows.net/admin-data?sasToken...)
 * @param pdfBuffer - PDF buffer to upload
 * @param userId - user ID string
 * @param fileName - file name like "receipt.pdf"
 * @returns URL of uploaded PDF blob
 */
export async function uploadUserReceiptPdfWithSas(
  pdfBuffer: Buffer,
  userId: string,
  fileName: string = "receipt.pdf"
): Promise<string> {
  try {
    const sasUrl = await generateSasToken("admin-data");

    // Create BlobServiceClient using SAS URL (container level URL + SAS)
    const blobServiceClient = new BlobServiceClient(
      `https://${process.env.storageAccountName}.blob.core.windows.net?${sasUrl}`
    );
    console.log(blobServiceClient);

    // Extract container name from SAS URL
    // For example: https://account.blob.core.windows.net/admin-data?sasToken
    // containerName is the path segment after hostname: "admin-data"

    const containerName = "admin-data";

    const containerClient = blobServiceClient.getContainerClient(containerName);
    console.log(containerClient);

    const folderPath = `receiptPdf/${userId}/`; // folder path prefix

    // Delete old blobs in user's folder
    //await deleteUserFolder(containerClient, folderPath);
    console.log("went pass this");

    // Upload new PDF to the user's folder
    const blobName = `${folderPath}${fileName}`;
    const uploadedUrl = await uploadPdf(containerClient, blobName, pdfBuffer);

    console.log(`Uploaded PDF to: ${uploadedUrl}`);
    return uploadedUrl;
  } catch (error) {
    throw new Error(error);
  }
}
