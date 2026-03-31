import type {
  User,
  UserAccount,
  AccountBalance,
  Transfer,
  TransferStatusHistory,
  Quote,
  SystemAccount,
} from "@ledger-core/shared";

export type {
  User,
  UserAccount,
  AccountBalance,
  Transfer,
  TransferStatusHistory,
  Quote,
  SystemAccount,
} from "@ledger-core/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }

  return res.json();
}

// ── Users ──

export async function getUsers(): Promise<User[]> {
  return request<User[]>("/users");
}

export async function getUser(id: string): Promise<User> {
  return request<User>(`/users/${id}`);
}

export async function getUserAccounts(userId: string): Promise<UserAccount[]> {
  return request<UserAccount[]>(`/users/${userId}/accounts`);
}

export async function getAccountBalance(
  accountId: string
): Promise<AccountBalance> {
  return request<AccountBalance>(`/users/account/${accountId}`);
}

export async function createUser(data: {
  email: string;
  fullName: string;
  phone?: string;
  country: string;
}): Promise<{ user: User; userAccount: UserAccount }> {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Transfers ──

export async function getTransfers(): Promise<Transfer[]> {
  return request<Transfer[]>("/transfers");
}

export async function getTransfer(id: string): Promise<Transfer> {
  return request<Transfer>(`/transfers/${id}`);
}

export async function getTransferHistory(
  id: string
): Promise<TransferStatusHistory[]> {
  return request<TransferStatusHistory[]>(`/transfers/${id}/history`);
}

export async function createTransfer(data: {
  idempotencyKey: string;
  senderId: string;
  recipientId?: string;
  recipientDetails?: Record<string, unknown>;
  senderCurrency: string;
  recipientCurrency: string;
  amount: string;
  quoteId?: string;
}): Promise<Transfer> {
  return request("/transfers/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fundAccount(data: {
  userId: string;
  currency: string;
  amount: string;
}): Promise<AccountBalance> {
  return request("/transfers/fund", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Quotes ──

export async function createQuote(data: {
  senderCurrency: string;
  recipientCurrency: string;
  amount: string;
}): Promise<Quote> {
  return request("/quotes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getQuote(id: string): Promise<Quote> {
  return request<Quote>(`/quotes/${id}`);
}

// ── System Accounts ──

export async function getSystemAccounts(): Promise<SystemAccount[]> {
  return request<SystemAccount[]>("/system-accounts");
}

export async function getSystemAccount(
  currency: string
): Promise<SystemAccount> {
  return request<SystemAccount>(`/system-accounts/${currency}`);
}

export async function createFundingAccount(data: {
  currency: string;
}): Promise<SystemAccount> {
  return request("/system-accounts/funding", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
