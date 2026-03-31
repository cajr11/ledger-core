"use client";

import { useEffect, useState } from "react";
import { getSystemAccounts, type SystemAccount } from "@/lib/api";

export default function SystemAccountsPage() {
  const [accounts, setAccounts] = useState<SystemAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemAccounts()
      .then(setAccounts)
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
          View and manage system-level ledger accounts
        </p>
      </div>

      <div className="flex flex-col flex-1 bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        <div className="flex items-center bg-bg-table-header px-5 py-3.5">
          <div className="flex-1 text-xs font-medium text-text-secondary">
            Currency
          </div>
          <div className="flex-1 text-xs font-medium text-text-secondary">
            Account Type
          </div>
          <div className="flex-1 text-xs font-medium text-text-secondary">
            TigerBeetle ID
          </div>
          <div className="w-[160px] text-xs font-medium text-text-secondary">
            Created
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-secondary">Loading...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-secondary">
              No system accounts found
            </p>
          </div>
        ) : (
          accounts.map((acc, i) => (
            <div
              key={acc.id}
              className={`flex items-center px-5 py-3.5 hover:bg-bg-hover transition-colors ${
                i < accounts.length - 1
                  ? "border-b border-border-primary"
                  : ""
              }`}
            >
              <div className="flex-1 text-sm font-medium text-text-primary">
                {acc.currency}
              </div>
              <div className="flex-1 text-sm text-text-secondary">
                {acc.accountType}
              </div>
              <div className="flex-1 text-xs text-text-muted font-mono">
                {acc.tigerBeetleAccountId}
              </div>
              <div className="w-[160px] text-xs text-text-muted">
                {new Date(acc.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
