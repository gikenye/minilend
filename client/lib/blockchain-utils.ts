import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';

// RPC URL list with fallbacks
const RPC_URLS = [
  'https://alfajores-forno.celo-testnet.org', // Primary Celo RPC
  'https://alfajores-rpc.celo.org', // Alternate RPC
  'https://alfajores.rpc.thirdweb.com' // Another fallback
];

// Create client with multiple providers for fallback
export const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(RPC_URLS[0], {
    timeout: 30000, // 30 seconds
    retryCount: 3,
    retryDelay: 1000,
    batch: { batchSize: 10 }
  }),
  batch: { batchSize: 10 }
});

// Handle getLogs with pagination to avoid timeout
export async function getLogsWithPagination(
  topics: string[],
  address?: string,
  blockRange: number = 10000
) {
  const latestBlock = await publicClient.getBlockNumber();
  let logs = [];
  let fromBlock = 0n;
  
  while (fromBlock <= latestBlock) {
    const toBlock = fromBlock + BigInt(blockRange) > latestBlock 
      ? latestBlock 
      : fromBlock + BigInt(blockRange);
    
    try {
      const batchLogs = await publicClient.getLogs({
        address,
        topics: topics as any,
        fromBlock,
        toBlock
      });
      logs.push(...batchLogs);
    } catch (error) {
      console.error(`Error fetching logs for blocks ${fromBlock}-${toBlock}:`, error);
      
      // If we get a timeout, try with a smaller block range
      if (blockRange > 1000) {
        return getLogsWithPagination(topics, address, blockRange / 2);
      }
    }
    
    fromBlock = toBlock + 1n;
  }
  
  return logs;
}

// Try different RPC URLs if one fails
export async function switchRpcOnFailure<T>(
  operation: (rpcUrl: string) => Promise<T>
): Promise<T> {
  for (let i = 0; i < RPC_URLS.length; i++) {
    try {
      return await operation(RPC_URLS[i]);
    } catch (error: any) {
      console.error(`RPC error with ${RPC_URLS[i]}:`, error.message);
      
      // If this is the last URL, throw the error
      if (i === RPC_URLS.length - 1) {
        throw error;
      }
      
      // Otherwise try the next URL
      console.log(`Switching to next RPC: ${RPC_URLS[i+1]}`);
      publicClient.transport = http(RPC_URLS[i+1], {
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000
      });
    }
  }
  
  throw new Error('All RPC URLs failed');
} 