"use client";

import { useState } from "react";
import { createUser } from "@/lib/api";
import { X } from "lucide-react";

const COUNTRIES = [
  { code: "MX", label: "Mexico" },
  { code: "CO", label: "Colombia" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GH", label: "Ghana" },
  { code: "NG", label: "Nigeria" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateUserModal({ open, onClose, onCreated }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("MX");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await createUser({
        fullName,
        email,
        phone: phone || undefined,
        country,
      });
      setFullName("");
      setEmail("");
      setPhone("");
      setCountry("MX");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
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
            Create User
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
              Full Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-blue"
              placeholder="John Doe"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-blue"
              placeholder="john@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-blue"
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-bg-primary border border-border-input rounded-lg px-3 py-2.5 pr-8 text-sm text-text-primary outline-none focus:border-accent-blue appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-accent-red">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 bg-white text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}
