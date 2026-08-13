import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

let container;

export function getImagesContainer() {
  if (container) return container;
  const serviceUrl = process.env.BLOB_SERVICE_URL;
  if (!serviceUrl) throw new Error('BLOB_SERVICE_URL is not configured.');
  const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID });
  const service = new BlobServiceClient(serviceUrl, credential);
  container = service.getContainerClient(process.env.BLOB_CONTAINER ?? 'post-images');
  return container;
}
