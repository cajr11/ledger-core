export enum Ledger {
  USD = 1,
  USDC = 2,
  MXN = 3,
  COP = 4,
  CAD = 5,
  GHS = 6,
  NGN = 7,
}

export enum AccountType {
  USER_WALLET = 1, // individual user's account (liability)
  INTERNAL_POOL = 2, // system pool for conversions (e.g., USDC pool, MXN pool) (liability)
  FEE_COLLECTION = 3, // where fees accumulate (income)
  FUNDING_SOURCE = 4, // getting user's funds on to the platform (liability)
}

export enum TransferType {
  FUNDING = 1, // money entering the system
  WITHDRAWAL = 2, // money leaving the system
  TRANSFER = 3, // same-currency movement between users
  CONVERSION = 4, // currency conversion leg (MXN→USDC or USDC→NGN)
  FEE = 5, // fee deduction
  REFUND = 6, // reversal of a failed transfer
}

export type AccountBalance = {
  creditsPosted: string;
  debitsPosted: string;
  creditsPending: string;
  debitsPending: string;
  balance: string;
};

export enum TransferStatus {
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
