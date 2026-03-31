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
  FUNDING_SOURCE = 4, // money entering the system (on-ramp)
  OFF_RAMP = 5, // money exiting the system (off-ramp)
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
  COLLECTING = 'COLLECTING',
  FUNDS_RECEIVED = 'FUNDS_RECEIVED',
  CONVERTING = 'CONVERTING',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDING = 'REFUNDING',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  [TransferStatus.INITIATED]: [TransferStatus.COLLECTING, TransferStatus.FAILED, TransferStatus.CANCELLED],
  [TransferStatus.COLLECTING]: [TransferStatus.FUNDS_RECEIVED, TransferStatus.FAILED],
  [TransferStatus.FUNDS_RECEIVED]: [TransferStatus.CONVERTING, TransferStatus.COMPLETED, TransferStatus.FAILED],
  [TransferStatus.CONVERTING]: [TransferStatus.SENDING, TransferStatus.FAILED],
  [TransferStatus.SENDING]: [TransferStatus.COMPLETED, TransferStatus.FAILED],
  [TransferStatus.FAILED]: [TransferStatus.REFUNDING],
  [TransferStatus.REFUNDING]: [TransferStatus.REFUNDED],
};

export function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const FEE_RATE = 0.015; // 1.5% fee on transfers
