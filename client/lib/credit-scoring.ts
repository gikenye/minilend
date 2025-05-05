import { Address, PublicClient } from "viem";

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
  // Fetch all relevant events
  const [deposits, withdrawals, loans, repayments] = await Promise.all([
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
  const currentBalance = (await publicClient.readContract({
    address: contractAddress,
    abi: [
      {
        constant: true,
        inputs: [{ name: "user", type: "address" }],
        name: "userDeposits",
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "userDeposits",
    args: [userAddress],
  })) as bigint;

  // Convert balance to a normalized score (0-1)
  const balanceInEther = Number(currentBalance) / Math.pow(10, DECIMALS);
  const savingsScore = Math.min(balanceInEther / 1000, 1); // Normalize based on 1000 token target

  // 4. Calculate account age score (20%)
  let firstTransaction = allTransactions[0];
  let accountAgeScore = 0;

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
}
