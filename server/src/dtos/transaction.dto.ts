export class CreateTransactionDTO {
  constructor(
    public address: string,
    public amount: number,
    public type: string,
    public description?: string
  ) {}
}

export class UpdateTransactionDTO {
  constructor(public status: string) {}
}

export interface TransactionFilters {
  type?: "deposit" | "withdraw" | "borrow" | "repay";
  startDate?: Date;
  endDate?: Date;
  status?: "pending" | "completed" | "failed";
}
