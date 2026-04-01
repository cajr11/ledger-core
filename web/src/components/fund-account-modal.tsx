"use client";

import { useState } from "react";
import { fundAccount, type User } from "@/lib/api";
import { X } from "lucide-react";

const COUNTRY_CURRENCY: Record<string, string> = {
  MX: "MXN",
  CO: "COP",
  US: "USD",
  CA: "CAD",
  GH: "GHS",
  NG: "NGN",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onFunded: () => void;
  users: User[];
};

export default function FundAccountModal({
  open,
  onClose,
  onFunded,
  users,
}: Props) {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  const selectedUser = users.find((u) => u.id === userId);
  const currency = selectedUser
    ? COUNTRY_CURRENCY[selectedUser.country] ?? "USD"
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const balance = await fundAccount({
        userId,
        currency,
        amount,
      });
      setSuccess(
        `Funded successfully. New balance: ${(Number(balance.balance) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`
      );
      setAmount("");
      onFunded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fund account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg-card border border-border-primary rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-text-primary">
            Fund Account
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              User
            </label>
            <select
              required
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setSuccess("");
              }}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 pr-8 text-sm text-text-primary outline-none focus:border-accent-blue appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({COUNTRY_CURRENCY[u.country] ?? "USD"})
                </option>
              ))}
            </select>
          </div>

          {currency && (
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-primary rounded-lg">
              <span className="text-xs text-text-muted">Currency:</span>
              <span className="text-sm font-medium text-text-primary">
                {currency}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Amount
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-blue"
              placeholder="500000"
            />
            <span className="text-xs text-text-muted">
              Smallest unit (e.g. 500000 = {currency ? `5,000.00 ${currency}` : "..."})
            </span>
          </div>

          {error && <p className="text-sm text-accent-red">{error}</p>}
          {success && <p className="text-sm text-accent-green">{success}</p>}

          <button
            type="submit"
            disabled={submitting || !userId || !amount}
            className="mt-2 bg-white text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {submitting ? "Funding..." : "Fund Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
