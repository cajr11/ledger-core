"use client";

import { useEffect, useState } from "react";
import { getTransfers, getUsers, type Transfer, type User } from "@/lib/api";
import StatusBadge from "@/components/status-badge";
import {
  ArrowLeftRight,
  Banknote,
  Plus,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatAmount(amount: string, currency: string) {
  const num = Number(amount);
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function OverviewPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTransfers().catch(() => []), getUsers().catch(() => [])])
      .then(([t, u]) => {
        setTransfers(t);
        setUsers(u);
      })
      .finally(() => setLoading(false));
  }, []);

  const recentTransfers = transfers.slice(0, 5);

  return (
    <div className="flex flex-col gap-7 p-8 px-10 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-text-primary">Overview</h1>
          <p className="text-sm text-text-secondary">
            Monitor your ledger activity and balances
          </p>
        </div>
        <Link
          href="/transfers"
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus size={16} />
          Quick Action
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="flex items-center gap-4 bg-bg-card border border-border-primary rounded-xl p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-blue-bg">
            <ArrowLeftRight size={20} className="text-accent-blue" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Transfers</p>
            <p className="text-2xl font-bold">{transfers.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-bg-card border border-border-primary rounded-xl p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-green-bg">
            <Banknote size={20} className="text-accent-green" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Completed</p>
            <p className="text-2xl font-bold">
              {transfers.filter((t) => t.status === "COMPLETED").length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-bg-card border border-border-primary rounded-xl p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-purple-bg">
            <UserPlus size={20} className="text-accent-purple" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex flex-col flex-1 bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-7 pt-5 pb-3">
          <h2 className="text-[15px] font-semibold text-text-primary">
            Recent Activity
          </h2>
          <Link
            href="/transfers"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="flex flex-col px-7 pb-5">
          {loading ? (
            <p className="text-sm text-text-secondary py-8 text-center">
              Loading...
            </p>
          ) : recentTransfers.length === 0 ? (
            <p className="text-sm text-text-secondary py-8 text-center">
              No recent activity
            </p>
          ) : (
            recentTransfers.map((transfer, i) => (
              <div
                key={transfer.id}
                className={`flex items-center gap-3 py-3 ${
                  i < recentTransfers.length - 1
                    ? "border-b border-border-subtle"
                    : ""
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-hover">
                  <ArrowLeftRight size={14} className="text-text-secondary" />
                </div>
                <div className="flex flex-col flex-1 gap-0.5">
                  <span className="text-sm text-text-primary">
                    {transfer.sender?.fullName ?? transfer.senderId.slice(0, 8)}{" "}
                    <ArrowRight
                      size={12}
                      className="inline text-text-muted mx-1"
                    />
                    {transfer.recipient?.fullName ??
                      transfer.recipientId?.slice(0, 8) ??
                      "External"}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {formatAmount(transfer.amount, transfer.senderCurrency)}
                  </span>
                </div>
                <StatusBadge status={transfer.status} />
                <span className="text-[11px] text-text-muted ml-2 min-w-[50px] text-right">
                  {timeAgo(transfer.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
