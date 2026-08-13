import { CosmosClient } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

let container;
let reportsContainer;

export function getPostsContainer() {
  if (container) return container;
  const endpoint = process.env.COSMOS_ENDPOINT;
  if (!endpoint) throw new Error('COSMOS_ENDPOINT is not configured.');
  const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID });
  const client = new CosmosClient({ endpoint, aadCredentials: credential });
  container = client
    .database(process.env.COSMOS_DATABASE ?? 'machinaka-zoo')
    .container(process.env.COSMOS_CONTAINER ?? 'posts');
  return container;
}

export function getReportsContainer() {
  if (reportsContainer) return reportsContainer;
  const endpoint = process.env.COSMOS_ENDPOINT;
  if (!endpoint) throw new Error('COSMOS_ENDPOINT is not configured.');
  const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID });
  const client = new CosmosClient({ endpoint, aadCredentials: credential });
  reportsContainer = client
    .database(process.env.COSMOS_DATABASE ?? 'machinaka-zoo')
    .container(process.env.COSMOS_REPORTS_CONTAINER ?? 'reports');
  return reportsContainer;
}
