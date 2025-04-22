// This is a TypeScript implementation of the Python loan limit calculation algorithm

interface TransactionSummary {
  avgMonthlyVolume: number
  transactionCount30d: number
  avgTransactionValue: number
  nightTransactionsRatio: number
  savingsBalance: number
  socialConnections: number
  accountAge: number
}

interface LoanLimitResult {
  limit: number
  factors: {
    baseLimit: number
    creditAdjustment: number
    transactionVolume: number
    creditScore: number
    maxLimit: number
  }
}

export function calculateLoanLimit(transactionSummary: TransactionSummary, creditScore: number): LoanLimitResult {
  // Constants
  const MAX_LOAN_LIMIT = 1000 // Maximum loan in cUSD
  const BASE_MULTIPLIER = 0.7 // Base multiplier for average monthly volume

  // Calculate base limit from transaction volume
  const baseLimit = transactionSummary.avgMonthlyVolume * BASE_MULTIPLIER

  // Adjust based on credit score (0-1000)
  const normalizedCreditScore = creditScore / 1000 // Convert to 0-1 scale
  const creditAdjustment = baseLimit * normalizedCreditScore * 0.3 // Up to 30% boost

  // Calculate final limit
  let finalLimit = baseLimit + creditAdjustment

  // Apply transaction frequency bonus (up to 10%)
  const txFrequencyBonus = Math.min(transactionSummary.transactionCount30d / 60, 1) * 0.1 * baseLimit
  finalLimit += txFrequencyBonus

  // Apply savings balance bonus (up to 15%)
  const savingsBonus = Math.min(transactionSummary.savingsBalance / 1000, 1) * 0.15 * baseLimit
  finalLimit += savingsBonus

  // Cap at maximum limit
  finalLimit = Math.min(finalLimit, MAX_LOAN_LIMIT)

  // Round to nearest 10
  finalLimit = Math.floor(finalLimit / 10) * 10

  return {
    limit: finalLimit,
    factors: {
      baseLimit,
      creditAdjustment,
      transactionVolume: transactionSummary.avgMonthlyVolume,
      creditScore,
      maxLimit: MAX_LOAN_LIMIT,
    },
  }
}
