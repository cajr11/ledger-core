"use client";

import { useEffect, useState } from "react";
import { getSystemAccounts } from "@/lib/api";
import type { AccountBalance } from "@ledger-core/shared";
import { formatAmount } from "@/lib/format";

type SystemAccountWithBalance = {
  id: string;
  tigerBeetleAccountId: string;
  currency: string;
  accountType: string;
  createdAt: string;
  balance: AccountBalance | null;
};

const typeLabels: Record<string, string> = {
  FUNDING_SOURCE: "Funding Source",
  INTERNAL_POOL: "Internal Pool",
  FEE_COLLECTION: "Fee Collection",
  OFF_RAMP: "Off Ramp",
};

const typeColors: Record<string, string> = {
  FUNDING_SOURCE: "bg-accent-blue-bg text-accent-blue",
  INTERNAL_POOL: "bg-accent-purple-bg text-accent-purple",
  FEE_COLLECTION: "bg-accent-green-bg text-accent-green",
  OFF_RAMP: "bg-accent-yellow-bg text-accent-yellow",
};

function groupByCurrency(accounts: SystemAccountWithBalance[]) {
  const groups: Record<string, SystemAccountWithBalance[]> = {};
  for (const acc of accounts) {
    if (!groups[acc.currency]) groups[acc.currency] = [];
    groups[acc.currency].push(acc);
  }
  return groups;
}

export default function SystemAccountsPage() {
  const [accounts, setAccounts] = useState<SystemAccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemAccounts()
      .then((data) => setAccounts(data as SystemAccountWithBalance[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = groupByCurrency(accounts);

  return (
    <div className="flex flex-col gap-6 p-8 px-10 h-full overflow-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold text-text-primary">
          System Accounts
        </h1>
        <p className="text-sm text-text-secondary">
          Ledger balances for funding sources, pools, and fee accounts
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex items-center justify-center flex-1 bg-bg-card border border-border-primary rounded-xl">
          <p className="text-sm text-text-secondary">
            No system accounts found
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([currency, accs]) => (
          <div key={currency} className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-text-primary border-b border-border-primary pb-2">
              {currency}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {accs.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-bg-card border border-border-primary rounded-xl p-5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeColors[acc.accountType] ?? "bg-bg-hover text-text-secondary"}`}
                    >
                      {typeLabels[acc.accountType] ?? acc.accountType}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      TB: {acc.tigerBeetleAccountId}
                    </span>
                  </div>

                  {/* Balances */}
                  {acc.balance ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[11px] text-text-muted mb-1">Credits</p>
                        <p className="text-sm font-semibold text-accent-green">
                          {formatAmount(acc.balance.creditsPosted)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-muted mb-1">Debits</p>
                        <p className="text-sm font-semibold text-accent-red">
                          {formatAmount(acc.balance.debitsPosted)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-muted mb-1">Net Balance</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatAmount(acc.balance.balance)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">Balance unavailable</p>
                  )}

                  {/* Pending */}
                  {acc.balance &&
                    (acc.balance.creditsPending !== "0" ||
                      acc.balance.debitsPending !== "0") && (
                      <div className="flex gap-4 mt-3 pt-3 border-t border-border-subtle">
                        <span className="text-[11px] text-text-muted">
                          Pending credits:{" "}
                          <span className="text-accent-yellow">
                            {formatAmount(acc.balance.creditsPending)}
                          </span>
                        </span>
                        <span className="text-[11px] text-text-muted">
                          Pending debits:{" "}
                          <span className="text-accent-yellow">
                            {formatAmount(acc.balance.debitsPending)}
                          </span>
                        </span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
