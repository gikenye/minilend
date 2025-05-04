export const SUPPORTED_CURRENCIES = {
  cUSD: "Celo Dollar",
  USDC: "USD Coin",
  USDT: "Tether",
  cKES: "Celo Kenyan Shilling",
} as const;

export type Currency = keyof typeof SUPPORTED_CURRENCIES;

export const TESTNET_CURRENCIES = ["cUSD", "USDC", "USDT"] as const;
export const MAINNET_CURRENCIES = [...TESTNET_CURRENCIES, "cKES"] as const;

export type TestnetCurrency = (typeof TESTNET_CURRENCIES)[number];
export type MainnetCurrency = (typeof MAINNET_CURRENCIES)[number];

// Constants used across the app
export const DEFAULT_CURRENCY = "cUSD";
export const CKES_EXCHANGE_RATE = 140; // Updated from KES_EXCHANGE_RATE
export const MIN_BALANCE_THRESHOLD = 0.01;
export const MIN_WITHDRAWAL_CKES = 100; // Updated from MIN_WITHDRAWAL_KES
