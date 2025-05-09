// Client-side mock API that follows client-apis.json format
import { apiClient } from '@/lib/api-client';

export type TokenAddress = string;
export type Amount = number;

export async function deposit(token: TokenAddress, amount: Amount) {
  try {
    return await apiClient.deposit({ token, amount });
  } catch (error) {
    console.error('Error in deposit:', error);
    throw error;
  }
}

export async function withdraw(token: TokenAddress) {
  try {
    return await apiClient.withdraw({ token });
  } catch (error) {
    console.error('Error in withdraw:', error);
    throw error;
  }
}

export async function borrow(token: TokenAddress, amount: Amount) {
  try {
    return await apiClient.borrow({ token, amount });
  } catch (error) {
    console.error('Error in borrow:', error);
    throw error;
  }
}

export async function repay(token: TokenAddress, amount: Amount) {
  try {
    return await apiClient.repay({ token, amount });
  } catch (error) {
    console.error('Error in repay:', error);
    throw error;
  }
}

export async function getYields(token: TokenAddress) {
  try {
    return await apiClient.getYields(token);
  } catch (error) {
    console.error('Error in getYields:', error);
    throw error;
  }
}

export async function getWithdrawable(token: TokenAddress) {
  try {
    return await apiClient.getWithdrawable(token);
  } catch (error) {
    console.error('Error in getWithdrawable:', error);
    throw error;
  }
}

export async function getAllPools() {
  try {
    return await apiClient.getAllLendingPools();
  } catch (error) {
    console.error('Error in getAllPools:', error);
    throw error;
  }
}

export async function getPoolStatus() {
  try {
    return await apiClient.getLendingPoolStatus();
  } catch (error) {
    console.error('Error in getPoolStatus:', error);
    throw error;
  }
}

export async function getPoolById(poolId: string) {
  try {
    return await apiClient.getLendingPoolById(poolId);
  } catch (error) {
    console.error('Error in getPoolById:', error);
    throw error;
  }
} 