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
  USER_WALLET = 1, // individual user's account
  INTERNAL_POOL = 2, // system pool for conversions (e.g., USDC pool, MXN pool)
  FEE_COLLECTION = 3, // where fees accumulate
}
