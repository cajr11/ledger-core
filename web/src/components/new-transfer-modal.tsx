"use client";

import { useState, useEffect } from "react";
import { getUsers, createTransfer, type User } from "@/lib/api";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function NewTransferModal({ open, onClose, onCreated }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [senderId, setSenderId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      getUsers()
        .then(setUsers)
        .catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const sender = users.find((u) => u.id === senderId);
  const recipient = users.find((u) => u.id === recipientId);

  const senderCountryCurrency: Record<string, string> = {
    MX: "MXN",
    CO: "COP",
    US: "USD",
    CA: "CAD",
    GH: "GHS",
    NG: "NGN",
  };

  const senderCurrency = sender
    ? senderCountryCurrency[sender.country] ?? "USD"
    : "";
  const recipientCurrency = recipient
    ? senderCountryCurrency[recipient.country] ?? "USD"
    : "";

  const isCrossCurrency = senderCurrency !== recipientCurrency;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (senderId === recipientId) {
      setError("Sender and recipient must be different");
      return;
    }

    setSubmitting(true);

    try {
      await createTransfer({
        idempotencyKey: crypto.randomUUID(),
        senderId,
        recipientId,
        senderCurrency,
        recipientCurrency,
        amount,
      });
      setAmount("");
      setSenderId("");
      setRecipientId("");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
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
            New Transfer
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
              From
            </label>
            <select
              required
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 pr-8 text-sm text-text-primary outline-none focus:border-accent-blue appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
            >
              <option value="">Select sender</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({senderCountryCurrency[u.country] ?? "USD"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              To
            </label>
            <select
              required
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 pr-8 text-sm text-text-primary outline-none focus:border-accent-blue appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
            >
              <option value="">Select recipient</option>
              {users
                .filter((u) => u.id !== senderId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({senderCountryCurrency[u.country] ?? "USD"})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Amount {senderCurrency && `(${senderCurrency})`}
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 pr-8 text-sm text-text-primary outline-none focus:border-accent-blue appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
              placeholder="10000"
            />
            <span className="text-xs text-text-muted">
              Enter in smallest unit (e.g. centavos)
            </span>
          </div>

          {isCrossCurrency && senderCurrency && recipientCurrency && (
            <p className="text-xs text-accent-yellow">
              Cross-border transfer: {senderCurrency} → {recipientCurrency} (1.5% fee applies)
            </p>
          )}

          {error && <p className="text-sm text-accent-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !senderId || !recipientId || !amount}
            className="mt-2 bg-white text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Transfer"}
          </button>
        </form>
      </div>
    </div>
  );
}
