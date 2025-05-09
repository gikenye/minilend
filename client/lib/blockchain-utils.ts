import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';

// RPC URL list with fallbacks
const RPC_URLS = [
  'https://alfajores-forno.celo-testnet.org', // Primary Celo RPC
  'https://alfajores-rpc.celo.org', // Alternate RPC
  'https://alfajores.rpc.thirdweb.com', // Another fallback
  'https://celo-alfajores.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Infura fallback
  'https://celo-alfajores--rpc.datahub.figment.io/apikey/e122780873be5a0c3e341115127bf9a0' // Figment fallback
];

// Track the current RPC index
let currentRpcIndex = 0;

// Get current RPC URL
const getCurrentRpcUrl = () => RPC_URLS[currentRpcIndex];

// Rotate to next RPC URL
const rotateToNextRpc = () => {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_URLS.length;
  console.log(`Rotating to RPC: ${getCurrentRpcUrl()}`);
  return getCurrentRpcUrl();
};

// Create client with transport that can be updated
export const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(getCurrentRpcUrl(), {
    timeout: 30000, // 30 seconds
    retryCount: 3,
    retryDelay: 1000,
  }),
});

// Update the client's transport with a new RPC URL
export const updateClientTransport = (rpcUrl: string) => {
  // Create a new transport with the updated URL
  const newTransport = http(rpcUrl, {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
  });
  
  // Recreate the publicClient with the new transport
  Object.assign(publicClient, createPublicClient({
    chain: celoAlfajores,
    transport: newTransport,
  }));
};

// Handle getLogs with pagination to avoid timeout
export async function getLogsWithPagination(
  topics: string[],
  address?: string,
  blockRange: number = 10000
) {
  const latestBlock = await publicClient.getBlockNumber();
  let logs = [];
  let fromBlock = BigInt(0);
  
  while (fromBlock <= latestBlock) {
    const toBlock = fromBlock + BigInt(blockRange) > latestBlock 
      ? latestBlock 
      : fromBlock + BigInt(blockRange);
    
    try {
      // Use any to bypass the type checking for now
      // This is not ideal but will work with the viem API
      const params: any = {
        address: address as `0x${string}` | undefined,
        fromBlock,
        toBlock
      };
      
      // Add topics if provided
      if (topics.length > 0) {
        params.topics = topics.map(t => t as `0x${string}` | null);
      }
      
      const batchLogs = await publicClient.getLogs(params);
      logs.push(...batchLogs);
    } catch (error) {
      console.error(`Error fetching logs for blocks ${fromBlock}-${toBlock}:`, error);
      
      // If we get a timeout, try with a smaller block range
      if (blockRange > 1000) {
        return getLogsWithPagination(topics, address, blockRange / 2);
      }
      
      // Try a different RPC URL
      updateClientTransport(rotateToNextRpc());
      
      // Retry with same block range after changing RPC
      continue;
    }
    
    fromBlock = toBlock + BigInt(1);
  }
  
  return logs;
}

// Try different RPC URLs if one fails
export async function switchRpcOnFailure<T>(
  operation: (rpcUrl: string) => Promise<T>
): Promise<T> {
  // Try all RPC URLs
  const initialRpcIndex = currentRpcIndex;
  let attempts = 0;
  
  while (attempts < RPC_URLS.length) {
    try {
      const currentRpcUrl = getCurrentRpcUrl();
      return await operation(currentRpcUrl);
    } catch (error: any) {
      console.error(`RPC error with ${getCurrentRpcUrl()}:`, error.message);
      
      // Special handling for block range errors
      if (error.message && (
          error.message.includes("block is out of range") || 
          error.message.includes("execution reverted") ||
          error.message.includes("timeout") ||
          error.message.includes("connection error")
        )) {
        console.log("Detected RPC synchronization or connection issue, switching providers...");
      }
      
      // Update the client with next RPC
      updateClientTransport(rotateToNextRpc());
      
      // If we've tried all RPCs, throw the error
      attempts++;
      if (currentRpcIndex === initialRpcIndex && attempts >= RPC_URLS.length) {
        throw new Error('All RPC URLs failed: ' + error.message);
      }
    }
  }
  
  throw new Error('All RPC URLs failed');
}

// Function to reset RPC connection (can be called when user performs critical actions)
export function resetRpcConnection() {
  // Start with the first RPC again
  currentRpcIndex = 0;
  updateClientTransport(getCurrentRpcUrl());
  return getCurrentRpcUrl();
}

// Auto-retry a specific blockchain call with RPC fallbacks
export async function executeWithRpcFallback<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      lastError = error;
      
      // For specific RPC errors, try switching providers
      if (
        error.message?.includes('block is out of range') ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection error')
      ) {
        updateClientTransport(rotateToNextRpc());
        continue;
      }
      
      // If it's not an RPC-related error, stop retrying
      if (
        !error.message?.includes('RpcRequestError') &&
        !error.message?.includes('timeout')
      ) {
        throw error;
      }
      
      // Otherwise rotate RPC and try again
      updateClientTransport(rotateToNextRpc());
    }
  }
  
  throw lastError || new Error('Function failed after multiple retries');
} 