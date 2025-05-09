import { Address, PublicClient } from "viem";
import { executeWithRpcFallback } from "./blockchain-utils";

export interface CreditScoreBreakdown {
  repaymentHistory: number;
  transactionFrequency: number;
  savingsPattern: number;
  accountAge: number;
}

export interface CreditScoreResult {
  score: number;
  breakdown: CreditScoreBreakdown;
}

const DAYS_IN_SECONDS = 86400;
const MAX_AGE_DAYS = 365;
const DECIMALS = 18;

export async function calculateCreditScore(
  userAddress: Address,
  contractAddress: Address,
  publicClient: PublicClient
): Promise<CreditScoreResult> {
  try {
    return await executeWithRpcFallback(async () => {
      // Fetch all relevant events with better error handling
      const fetchLogs = async () => {
        try {
          return await Promise.all([
            // Fetch deposit events
            publicClient.getLogs({
              event: {
                type: "event",
                name: "Deposit",
                inputs: [
                  { indexed: true, type: "address", name: "user" },
                  { indexed: false, type: "uint256", name: "amount" },
                ],
              },
              args: { user: userAddress },
              fromBlock: BigInt(0),
              toBlock: "latest",
            }),
            // Fetch withdrawal events
            publicClient.getLogs({
              event: {
                type: "event",
                name: "Withdrawal",
                inputs: [
                  { indexed: true, type: "address", name: "user" },
                  { indexed: false, type: "uint256", name: "amount" },
                ],
              },
              args: { user: userAddress },
              fromBlock: BigInt(0),
              toBlock: "latest",
            }),
            // Fetch loan events
            publicClient.getLogs({
              event: {
                type: "event",
                name: "LoanCreated",
                inputs: [
                  { indexed: true, type: "address", name: "user" },
                  { indexed: false, type: "uint256", name: "amount" },
                ],
              },
              args: { user: userAddress },
              fromBlock: BigInt(0),
              toBlock: "latest",
            }),
            // Fetch repayment events
            publicClient.getLogs({
              event: {
                type: "event",
                name: "LoanRepaid",
                inputs: [
                  { indexed: true, type: "address", name: "user" },
                  { indexed: false, type: "uint256", name: "amount" },
                ],
              },
              args: { user: userAddress },
              fromBlock: BigInt(0),
              toBlock: "latest",
            }),
          ]);
        } catch (error) {
          console.error("Error fetching event logs:", error);
          // Return empty arrays if logs can't be fetched
          return [[], [], [], []];
        }
      };

      const [deposits, withdrawals, loans, repayments] = await fetchLogs();

      // 1. Calculate repayment history score (30%)
      let repaymentScore = 0;
      if (loans.length > 0) {
        const onTimeRepayments = loans.filter((loan) => {
          const repayment = repayments.find(
            (r) =>
              r.blockNumber && loan.blockNumber && r.blockNumber > loan.blockNumber
          );
          return repayment !== undefined;
        }).length;
        repaymentScore = onTimeRepayments / loans.length;
      }

      // 2. Calculate transaction frequency score (25%)
      const allTransactions = [
        ...deposits,
        ...withdrawals,
        ...loans,
        ...repayments,
      ];
      const txFrequencyScore = Math.min(
        allTransactions.length / (MAX_AGE_DAYS / 30), // Normalize to monthly transactions
        1
      );

      // 3. Calculate savings pattern score (25%)
      let savingsScore = 0;
      try {
        // The contract doesn't have userDeposits function; use userLoans or another approach
        // Use getLogs to estimate user's activity and deposits
        const depositEvents = await publicClient.getLogs({
          event: {
            type: "event",
            name: "Deposit",
            inputs: [
              { indexed: true, type: "address", name: "user" },
              { indexed: true, type: "address", name: "token" },
              { indexed: false, type: "uint256", name: "amount" },
            ],
          },
          args: { user: userAddress },
          fromBlock: BigInt(0),
          toBlock: "latest",
        });

        // Calculate total deposits from events
        let totalDeposits = BigInt(0);
        for (const event of depositEvents) {
          if (event.args && event.args.amount) {
            totalDeposits += event.args.amount as bigint;
          }
        }

        // Convert balance to a normalized score (0-1)
        const balanceInEther = Number(totalDeposits) / Math.pow(10, DECIMALS);
        savingsScore = Math.min(balanceInEther / 1000, 1); // Normalize based on 1000 token target
      } catch (error) {
        console.error("Error calculating savings score:", error);
        // Continue with zero savings score if this fails
      }

      // 4. Calculate account age score (20%)
      let accountAgeScore = 0;
      
      if (allTransactions.length > 0) {
        try {
          let firstTransaction = allTransactions[0];

          if (firstTransaction && firstTransaction.blockNumber) {
            const firstBlock = await publicClient.getBlock({
              blockNumber: firstTransaction.blockNumber,
            });

            if (firstBlock.timestamp) {
              const ageInDays =
                (Date.now() / 1000 - Number(firstBlock.timestamp)) / DAYS_IN_SECONDS;
              accountAgeScore = Math.min(ageInDays / MAX_AGE_DAYS, 1);
            }
          }
        } catch (blockError) {
          console.error("Error getting block for account age:", blockError);
          // Default to a minimal age score if getting block fails
          accountAgeScore = 0.1;
        }
      }

      // Calculate weighted score
      const breakdown = {
        repaymentHistory: repaymentScore,
        transactionFrequency: txFrequencyScore,
        savingsPattern: savingsScore,
        accountAge: accountAgeScore,
      };

      const totalScore = Math.round(
        (repaymentScore * 0.3 +
          txFrequencyScore * 0.25 +
          savingsScore * 0.25 +
          accountAgeScore * 0.2) *
          1000
      );

      return {
        score: totalScore,
        breakdown,
      };
    });
  } catch (error) {
    console.error("Failed to calculate credit score even with RPC fallbacks:", error);
    // Return a default credit score when all RPC attempts fail
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
}
