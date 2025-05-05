"use client";

import React, { createContext, useContext, useState } from "react";
import { useWeb3 } from "./useWeb3";
import { Address, Hash } from "viem";
import minilendABI from "./minilend-abi.json";
import { DEFAULT_CURRENCY } from "@/types/currencies";
import { stableTokenABI } from "@celo/abis";
import {
  calculateCreditScore,
  type CreditScoreResult,
} from "@/lib/credit-scoring";

interface Yields {
  grossYield: string;
  netYield: string;
  usedForLoanRepayment: string;
}

interface LendingContextType {
  loans: Loan[];
  activeLoan: Loan | null;
  applyForLoan: (application: LoanApplication) => Promise<Hash>;
  repayLoan: (amount: string) => Promise<Hash>;
  fetchLoans: () => Promise<void>;
  fetchActiveLoan: () => Promise<void>;
  getWithdrawable: () => Promise<WithdrawableResult>;
  getUserLoan: () => Promise<UserLoan>;
  borrow: (amount: string) => Promise<Hash>;
  getYields: () => Promise<Yields>;
  getCreditScore: () => Promise<CreditScoreResult>;
  deposit: (tokenType: string, amount: string) => Promise<Hash>;
}

interface LoanApplication {
  amount: string;
  duration: number;
  purpose: string;
  currency: string;
}

interface UserLoan {
  active: boolean;
  principal: bigint;
  interestAccrued: bigint;
  lastUpdate: bigint;
}

interface Loan {
  id: number;
  borrower: Address;
  amount: bigint;
  duration: number;
  startTime: number;
  isRepaid: boolean;
  currency: string;
}

interface WithdrawableResult {
  withdrawable: string;
  usedForLoan: string;
}

const LendingContext = createContext<LendingContextType | undefined>(undefined);

export function LendingProvider({ children }: { children: React.ReactNode }) {
  const { publicClient, walletClient, address, getStableTokenAddress } =
    useWeb3();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);

  const CONTRACT_ADDRESS =
    "0x164E90869634ADd3891BBfB8d410B0742f899826" as Address;

  const applyForLoan = async (application: LoanApplication): Promise<Hash> => {
    if (!walletClient || !address || !publicClient)
      throw new Error("Wallet not connected");

    // First approve the contract to spend tokens
    const tokenAddress = getStableTokenAddress(application.currency);
    const amountBigInt = BigInt(Math.floor(Number(application.amount) * 1e18));

    // Approve the contract to spend tokens
    const approvalHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: stableTokenABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amountBigInt],
      account: address,
    });

    // Wait for approval transaction to be mined
    await publicClient?.waitForTransactionReceipt({ hash: approvalHash });

    // Then borrow
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: minilendABI,
      functionName: "borrow",
      args: [getStableTokenAddress(application.currency), amountBigInt],
      account: address,
    });

    await fetchLoans();
    return hash;
  };

  const repayLoan = async (amount: string): Promise<Hash> => {
    if (!walletClient || !address) throw new Error("Wallet not connected");

    const tokenAddress = getStableTokenAddress(DEFAULT_CURRENCY);
    const amountBigInt = BigInt(Math.floor(Number(amount) * 1e18));

    // First approve the contract to spend tokens
    const approvalHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: stableTokenABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amountBigInt],
      account: address,
    });

    // Wait for approval transaction to be mined
    await publicClient?.waitForTransactionReceipt({ hash: approvalHash });

    // Then repay the loan
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: minilendABI,
      functionName: "repay",
      args: [tokenAddress, amountBigInt],
      account: address,
    });

    await fetchLoans();
    return hash;
  };

  const fetchLoans = async () => {
    if (!publicClient || !address) return;

    try {
      const loansData = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: minilendABI,
        functionName: "getLoansByBorrower",
        args: [address],
      })) as Loan[];

      setLoans(loansData);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const fetchActiveLoan = async () => {
    if (!publicClient || !address) return;

    try {
      const activeLoanData = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: minilendABI,
        functionName: "getActiveLoan",
        args: [address],
      })) as Loan;

      setActiveLoan(activeLoanData);
    } catch (error) {
      console.error("Error fetching active loan:", error);
    }
  };

  const getWithdrawable = async (): Promise<WithdrawableResult> => {
    if (!publicClient || !address) {
      throw new Error("Web3 not initialized");
    }

    try {
      // Wrap in try-catch to handle potential ABI mismatch
      const result = await publicClient
        .readContract({
          address: CONTRACT_ADDRESS,
          abi: minilendABI,
          functionName: "getWithdrawable",
          args: [getStableTokenAddress(DEFAULT_CURRENCY), address],
        })
        .catch((error) => {
          console.error("Error reading withdrawable:", error);
          // Return zero values if contract call fails
          return [BigInt(0), BigInt(0)];
        });

      const [withdrawable, usedForLoan] = result as [bigint, bigint];

      return {
        withdrawable: withdrawable.toString(),
        usedForLoan: usedForLoan.toString(),
      };
    } catch (error) {
      console.error("Error getting withdrawable amount:", error);
      throw error;
    }
  };

  const getUserLoan = async (): Promise<UserLoan> => {
    if (!publicClient || !address) {
      throw new Error("Web3 not initialized");
    }

    try {
      // Wrap in try-catch to handle potential ABI mismatch
      const result = await publicClient
        .readContract({
          address: CONTRACT_ADDRESS,
          abi: minilendABI,
          functionName: "userLoans",
          args: [address, getStableTokenAddress(DEFAULT_CURRENCY)],
        })
        .catch((error) => {
          console.error("Error reading user loan:", error);
          // Return default values if contract call fails
          return [false, BigInt(0), BigInt(0), BigInt(0)];
        });

      const [active, principal, interestAccrued, lastUpdate] = result as [
        boolean,
        bigint,
        bigint,
        bigint
      ];

      return {
        active,
        principal,
        interestAccrued,
        lastUpdate,
      };
    } catch (error) {
      console.error("Error getting user loan:", error);
      throw error;
    }
  };

  const borrow = async (amount: string): Promise<Hash> => {
    if (!walletClient || !address) throw new Error("Wallet not connected");

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: minilendABI,
      functionName: "borrow",
      args: [
        getStableTokenAddress(DEFAULT_CURRENCY),
        BigInt(Math.floor(Number(amount) * 1e18)),
      ],
      account: address,
    });

    await fetchLoans();
    return hash;
  };

  const getYields = async (): Promise<Yields> => {
    if (!publicClient || !address) {
      throw new Error("Web3 not initialized");
    }

    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: minilendABI,
        functionName: "getYields",
        args: [getStableTokenAddress(DEFAULT_CURRENCY), address],
      });

      // Result is a struct, not an array
      const yields = result as {
        grossYield: bigint;
        netYield: bigint;
        usedForLoanRepayment: bigint;
      };

      return {
        grossYield: yields.grossYield.toString(),
        netYield: yields.netYield.toString(),
        usedForLoanRepayment: yields.usedForLoanRepayment.toString(),
      };
    } catch (error) {
      console.error("Error fetching yields:", error);
      return {
        grossYield: "0",
        netYield: "0",
        usedForLoanRepayment: "0",
      };
    }
  };

  const getCreditScore = async (): Promise<CreditScoreResult> => {
    if (!publicClient || !address) {
      throw new Error("Web3 not initialized");
    }

    const score = await calculateCreditScore(
      address,
      CONTRACT_ADDRESS,
      publicClient
    );

    return score;
  };

  const deposit = async (tokenType: string, amount: string): Promise<Hash> => {
    if (!walletClient || !address) throw new Error("Wallet not connected");

    const tokenAddress = getStableTokenAddress(tokenType);
    const amountBigInt = BigInt(Math.floor(Number(amount) * 1e18));

    // First approve the contract to spend tokens
    const approvalHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: stableTokenABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amountBigInt],
      account: address,
    });

    // Wait for approval transaction to be mined
    await publicClient?.waitForTransactionReceipt({ hash: approvalHash });

    // Then deposit into lending pool
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: minilendABI,
      functionName: "deposit",
      args: [tokenAddress, amountBigInt],
      account: address,
    });

    await fetchBalances();
    return hash;
  };

  return (
    <LendingContext.Provider
      value={{
        loans,
        activeLoan,
        applyForLoan,
        repayLoan,
        fetchLoans,
        fetchActiveLoan,
        getWithdrawable,
        getUserLoan,
        borrow,
        getYields,
        getCreditScore,
        deposit,
      }}
    >
      {children}
    </LendingContext.Provider>
  );
}

export function useLending() {
  const context = useContext(LendingContext);
  if (!context) {
    throw new Error("useLending must be used within a LendingProvider");
  }
  return context;
}
