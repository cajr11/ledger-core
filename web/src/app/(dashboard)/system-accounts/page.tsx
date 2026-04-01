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

export default function SystemAccountsPage() {
  const [accounts, setAccounts] = useState<SystemAccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemAccounts()
      .then((data) => setAccounts(data as SystemAccountWithBalance[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 p-8 px-10 h-full">
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
      ) : accounts.length === 0 ? (
        <div className="flex items-center justify-center flex-1 bg-bg-card border border-border-primary rounded-xl">
          <p className="text-sm text-text-secondary">
            No system accounts found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex flex-col gap-4 bg-bg-card border border-border-primary rounded-xl p-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-text-primary">
                    {acc.currency}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeColors[acc.accountType] ?? "bg-bg-hover text-text-secondary"}`}
                  >
                    {typeLabels[acc.accountType] ?? acc.accountType}
                  </span>
                </div>
                <span className="text-[11px] text-text-muted font-mono">
                  TB: {acc.tigerBeetleAccountId}
                </span>
              </div>

              {/* Balances */}
              {acc.balance ? (
                <div className="grid grid-cols-3 gap-4">
                  <BalanceCard
                    label="Credits Posted"
                    value={formatAmount(acc.balance.creditsPosted)}
                    color="text-accent-green"
                  />
                  <BalanceCard
                    label="Debits Posted"
                    value={formatAmount(acc.balance.debitsPosted)}
                    color="text-accent-red"
                  />
                  <BalanceCard
                    label="Net Balance"
                    value={formatAmount(acc.balance.balance)}
                    color="text-text-primary"
                  />
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  Balance unavailable
                </p>
              )}

              {/* Pending */}
              {acc.balance &&
                (acc.balance.creditsPending !== "0" ||
                  acc.balance.debitsPending !== "0") && (
                  <div className="flex gap-4 pt-2 border-t border-border-subtle">
                    <span className="text-xs text-text-muted">
                      Pending credits:{" "}
                      <span className="text-accent-yellow">
                        {formatAmount(acc.balance.creditsPending)}
                      </span>
                    </span>
                    <span className="text-xs text-text-muted">
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
      )}
    </div>
  );
}

function BalanceCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-bg-primary rounded-lg p-3">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className={`text-base font-semibold ${color}`}>{value}</span>
    </div>
  );
}
