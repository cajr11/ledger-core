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
  USER_WALLET = 1,
  INTERNAL_POOL = 2,
  FEE_COLLECTION = 3,
  FUNDING_SOURCE = 4,
  OFF_RAMP = 5,
}

export enum TransferType {
  FUNDING = 1,
  WITHDRAWAL = 2,
  TRANSFER = 3,
  CONVERSION = 4,
  FEE = 5,
  REFUND = 6,
}

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

export const FEE_RATE = 0.015;

export const VALID_TRANSITIONS: Record<string, string[]> = {
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

export type AccountBalance = {
  creditsPosted: string;
  debitsPosted: string;
  creditsPending: string;
  debitsPending: string;
  balance: string;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  country: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type UserAccount = {
  id: string;
  userId: string;
  tigerBeetleAccountId: string;
  currency: string;
  accountType: string;
  createdAt: string;
};

export type Transfer = {
  id: string;
  idempotencyKey: string;
  type: string;
  senderId: string;
  recipientId: string | null;
  recipientDetails: Record<string, unknown> | null;
  senderCurrency: string;
  recipientCurrency: string;
  amount: string;
  exchangeRate: string | null;
  convertedAmount: string | null;
  fee: string | null;
  providerRef: string | null;
  status: string;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  recipient?: User;
};

export type TransferStatusHistory = {
  id: string;
  transferId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type Quote = {
  id: string;
  senderCurrency: string;
  recipientCurrency: string;
  amount: string;
  fee: string;
  amountAfterFee: string;
  exchangeRate: string;
  convertedAmount: string;
  expiresAt: string;
};

export type SystemAccount = {
  id: string;
  tigerBeetleAccountId: string;
  currency: string;
  accountType: string;
  createdAt: string;
};
