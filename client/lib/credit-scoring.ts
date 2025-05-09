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
  let savingsScore = 0;
  try {
    // The contract doesn't have userDeposits function; use userLoans or another approach
    // First, try to use userLoans which exists in the contract
    const userLoansABI = [
      {
        inputs: [
          { name: "", type: "address" },
          { name: "", type: "address" }
        ],
        name: "userLoans",
        outputs: [
          { name: "active", type: "bool" },
          { name: "principal", type: "uint256" },
          { name: "interestAccrued", type: "uint256" },
          { name: "lastUpdate", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
      }
    ];

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
