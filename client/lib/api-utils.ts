// Client-side API utilities
import { STABLECOIN_ADDRESSES } from './api-client';

export function isValidStablecoinAddress(address: string): boolean {
  // Check if the provided address is in the list of valid stablecoin addresses
  return Object.values(STABLECOIN_ADDRESSES).includes(address);
}

// Helper to format amounts for display
export function formatAmount(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Helper to format token addresses for display
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Get human-readable token name from address
export function getTokenName(address: string): string {
  const entries = Object.entries(STABLECOIN_ADDRESSES);
  for (const [name, tokenAddress] of entries) {
    if (tokenAddress.toLowerCase() === address.toLowerCase()) {
      return name;
    }
  }
  return 'Unknown Token';
} 