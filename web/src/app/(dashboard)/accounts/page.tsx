"use client";

import { useEffect, useState } from "react";
import {
  getUsers,
  getUserAccounts,
  getAccountBalance,
  type User,
  type AccountBalance,
} from "@/lib/api";
import StatusBadge from "@/components/status-badge";
import { Plus, Search } from "lucide-react";

type UserWithBalance = User & {
  currency: string;
  balance: string;
  accountId: string;
};

const avatarColors = [
  "bg-accent-blue",
  "bg-accent-green",
  "bg-accent-red",
  "bg-accent-yellow",
  "bg-accent-purple",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AccountsPage() {
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const allUsers = await getUsers();
        const enriched: UserWithBalance[] = [];

        for (const user of allUsers) {
          try {
            const accounts = await getUserAccounts(user.id);
            if (accounts.length > 0) {
              const acc = accounts[0];
              let balance = "0.00";
              try {
                const bal: AccountBalance = await getAccountBalance(acc.id);
                balance = bal.balance;
              } catch {}
              enriched.push({
                ...user,
                currency: acc.currency,
                balance,
                accountId: acc.id,
              });
            } else {
              enriched.push({
                ...user,
                currency: "—",
                balance: "0.00",
                accountId: "",
              });
            }
          } catch {
            enriched.push({
              ...user,
              currency: "—",
              balance: "0.00",
              accountId: "",
            });
          }
        }

        setUsers(enriched);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-8 px-10 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-text-primary">Accounts</h1>
          <p className="text-sm text-text-secondary">
            Manage users and their wallet accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-input border border-border-input rounded-lg px-3.5 py-2.5">
            <Search size={16} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-40"
            />
          </div>
          <button className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
            <Plus size={16} />
            Create User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col flex-1 bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center bg-bg-table-header px-5 py-3.5">
          <div className="flex-1 text-xs font-medium text-text-secondary">
            User
          </div>
          <div className="flex-1 text-xs font-medium text-text-secondary">
            Email
          </div>
          <div className="w-[100px] text-xs font-medium text-text-secondary">
            Country
          </div>
          <div className="w-[100px] text-xs font-medium text-text-secondary">
            Currency
          </div>
          <div className="w-[140px] text-xs font-medium text-text-secondary">
            Balance
          </div>
          <div className="w-[100px] text-xs font-medium text-text-secondary">
            KYC
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-secondary">Loading accounts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-secondary">No accounts found</p>
          </div>
        ) : (
          filtered.map((user, i) => (
            <div
              key={user.id}
              className={`flex items-center px-5 py-3.5 hover:bg-bg-hover transition-colors ${
                i < filtered.length - 1
                  ? "border-b border-border-primary"
                  : ""
              }`}
            >
              <div className="flex-1 flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black ${avatarColors[i % avatarColors.length]}`}
                >
                  {getInitials(user.fullName)}
                </div>
                <span className="text-sm text-text-primary">
                  {user.fullName}
                </span>
              </div>
              <div className="flex-1 text-sm text-text-secondary">
                {user.email}
              </div>
              <div className="w-[100px] text-sm text-text-secondary">
                {user.country}
              </div>
              <div className="w-[100px] text-sm text-text-secondary">
                {user.currency}
              </div>
              <div className="w-[140px] text-sm font-medium text-accent-green">
                ${Number(user.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="w-[100px]">
                <StatusBadge status={user.kycStatus} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
