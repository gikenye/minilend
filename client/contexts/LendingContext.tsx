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
import { executeWithRpcFallback, switchRpcOnFailure } from "@/lib/blockchain-utils";

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

    return await executeWithRpcFallback(async () => {
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
        chain: publicClient.chain,
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
        chain: publicClient.chain,
      });

      await fetchLoans();
      return hash;
    });
  };

  const repayLoan = async (amount: string): Promise<Hash> => {
    if (!walletClient || !address || !publicClient) throw new Error("Wallet not connected");

    return await executeWithRpcFallback(async () => {
      const tokenAddress = getStableTokenAddress(DEFAULT_CURRENCY);
      const amountBigInt = BigInt(Math.floor(Number(amount) * 1e18));

      // First approve the contract to spend tokens
      const approvalHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: stableTokenABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amountBigInt],
        account: address,
        chain: publicClient.chain,
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
        chain: publicClient.chain,
      });

      await fetchLoans();
      return hash;
    });
  };

  const fetchLoans = async () => {
    if (!publicClient || !address) return;

    try {
      await executeWithRpcFallback(async () => {
        // Use events to get loan history instead
        const loanEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: {
            type: "event",
            name: "LoanCreated",
            inputs: [
              { indexed: true, type: "address", name: "user" },
              { indexed: true, type: "address", name: "token" },
              { indexed: false, type: "uint256", name: "amount" }
            ]
          },
          args: { user: address },
          fromBlock: BigInt(0),
          toBlock: "latest"
        });

        const repaymentEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: {
            type: "event",
            name: "LoanRepaid",
            inputs: [
              { indexed: true, type: "address", name: "user" },
              { indexed: true, type: "address", name: "token" },
              { indexed: false, type: "uint256", name: "amount" }
            ]
          },
          args: { user: address },
          fromBlock: BigInt(0),
          toBlock: "latest"
        });

        // Process loan events into Loan objects
        const processedLoans: Loan[] = [];
        
        for (let i = 0; i < loanEvents.length; i++) {
          const loanEvent = loanEvents[i];
          const loan: Loan = {
            id: i,
            borrower: address,
            amount: loanEvent.args?.amount as bigint || BigInt(0),
            duration: 30, // Default 30 days loan term
            startTime: Number(loanEvent.blockNumber || 0),
            isRepaid: false,
            currency: (loanEvent.args?.token as string) || ""
          };

          // Check if this loan is repaid by finding matching repayment events
          const repayment = repaymentEvents.find(event => 
            event.args?.token === loan.currency && 
            event.blockNumber && 
            loanEvent.blockNumber && 
            event.blockNumber > loanEvent.blockNumber
          );
          
          if (repayment) {
            loan.isRepaid = true;
          }
          
          processedLoans.push(loan);
        }

        setLoans(processedLoans);
        return processedLoans;
      });
    } catch (error) {
      console.error("Error fetching loans:", error);
      // Set empty array on error
      setLoans([]);
    }
  };

  const fetchActiveLoan = async () => {
    if (!publicClient || !address) return;

    try {
      // Use executeWithRpcFallback for RPC resilience
      await executeWithRpcFallback(async () => {
        // Use the userLoans function instead of getActiveLoan
        const userLoanData = await getUserLoan();
        
        if (userLoanData && userLoanData.active && userLoanData.principal > BigInt(0)) {
          // Create a Loan object from userLoanData
          const activeLoanData: Loan = {
            id: 0,
            borrower: address,
            amount: userLoanData.principal,
            duration: 30, // Default 30 days term
            startTime: Number(userLoanData.lastUpdate),
            isRepaid: false,
            currency: DEFAULT_CURRENCY
          };

          setActiveLoan(activeLoanData);
        } else {
          setActiveLoan(null);
        }
      });
    } catch (error) {
      console.error("Error fetching active loan:", error);
      setActiveLoan(null);
    }
  };

  const getWithdrawable = async (): Promise<WithdrawableResult> => {
    if (!publicClient || !address) {
      throw new Error("Web3 not initialized");
    }

    return await executeWithRpcFallback(async () => {
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
    });
  };

  const getUserLoan = async (): Promise<UserLoan> => {
    if (!publicClient || !address) {
      throw new Error("Web3 not initialized");
    }

    return await executeWithRpcFallback(async () => {
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
    });
  };

  const borrow = async (amount: string): Promise<Hash> => {
    if (!walletClient || !address || !publicClient) throw new Error("Wallet not connected");

    return await executeWithRpcFallback(async () => {
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: minilendABI,
        functionName: "borrow",
        args: [
          getStableTokenAddress(DEFAULT_CURRENCY),
          BigInt(Math.floor(Number(amount) * 1e18)),
        ],
        account: address,
        chain: publicClient.chain,
      });

      await fetchLoans();
      return hash;
    });
  };

  const getYields = async (): Promise<Yields> => {
    if (!publicClient || !address) {
      throw new Error("Web3 not initialized");
    }

    try {
      return await executeWithRpcFallback(async () => {
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
      });
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

    try {
      return await executeWithRpcFallback(async () => {
        const score = await calculateCreditScore(
          address,
          CONTRACT_ADDRESS,
          publicClient
        );
        return score;
      });
    } catch (error) {
      console.error("Error calculating credit score:", error);
      // Return a default score if calculation fails
      return {
        score: 500, // Default middle score
        breakdown: {
          repaymentHistory: 0.5,
          transactionFrequency: 0.5,
          savingsPattern: 0.5,
          accountAge: 0.5,
        }
      };
    }
  };

  const deposit = async (tokenType: string, amount: string): Promise<Hash> => {
    if (!walletClient || !address || !publicClient) throw new Error("Wallet not connected");

    return await executeWithRpcFallback(async () => {
      const tokenAddress = getStableTokenAddress(tokenType);
      const amountBigInt = BigInt(Math.floor(Number(amount) * 1e18));

      // First approve the contract to spend tokens
      const approvalHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: stableTokenABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amountBigInt],
        account: address,
        chain: publicClient.chain,
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
        chain: publicClient.chain,
      });

      await fetchLoans();
      return hash;
    });
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
