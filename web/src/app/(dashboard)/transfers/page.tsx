"use client";

import { useEffect, useState } from "react";
import { getTransfers, type Transfer } from "@/lib/api";
import StatusBadge from "@/components/status-badge";
import NewTransferModal from "@/components/new-transfer-modal";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatAmount } from "@/lib/format";

const tabs = ["All", "Completed", "Processing", "Failed"] as const;
type Tab = (typeof tabs)[number];

const tabFilter: Record<Tab, (t: Transfer) => boolean> = {
  All: () => true,
  Completed: (t) => t.status === "COMPLETED",
  Processing: (t) =>
    ["INITIATED", "COLLECTING", "FUNDS_RECEIVED", "CONVERTING", "SENDING"].includes(t.status),
  Failed: (t) => ["FAILED", "CANCELLED", "REFUNDING", "REFUNDED"].includes(t.status),
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getTransfers()
      .then(setTransfers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = transfers
    .filter(tabFilter[activeTab])
    .filter(
      (t) =>
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.sender?.fullName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.recipient?.fullName ?? "").toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="flex flex-col gap-5 p-8 px-10 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-text-primary">
            Transfers
          </h1>
          <p className="text-sm text-text-secondary">
            Track and manage all transfer activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-input border border-border-input rounded-lg px-3.5 py-2.5">
            <Search size={16} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search by ID or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-40"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <Plus size={16} />
            New Transfer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-primary">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] transition-colors ${
              activeTab === tab
                ? "text-text-primary font-medium border-b-2 border-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex flex-col flex-1 bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center bg-bg-table-header px-5 py-3.5">
          <div className="w-[120px] text-xs font-medium text-text-secondary">
            ID
          </div>
          <div className="flex-1 text-xs font-medium text-text-secondary">
            From
          </div>
          <div className="flex-1 text-xs font-medium text-text-secondary">
            To
          </div>
          <div className="w-[140px] text-xs font-medium text-text-secondary">
            Amount
          </div>
          <div className="w-[80px] text-xs font-medium text-text-secondary">
            Currency
          </div>
          <div className="w-[110px] text-xs font-medium text-text-secondary">
            Status
          </div>
          <div className="w-[100px] text-xs font-medium text-text-secondary">
            Time
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-secondary">Loading transfers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-secondary">No transfers found</p>
          </div>
        ) : (
          filtered.map((transfer, i) => (
            <div
              key={transfer.id}
              onClick={() => router.push(`/transfers/${transfer.id}`)}
              className={`flex items-center px-5 py-3.5 hover:bg-bg-hover transition-colors cursor-pointer ${
                i < filtered.length - 1
                  ? "border-b border-border-subtle"
                  : ""
              }`}
            >
              <div className="w-[120px] text-xs text-text-muted font-mono truncate">
                {transfer.id.slice(0, 8)}...
              </div>
              <div className="flex-1 text-sm text-text-primary">
                {transfer.sender?.fullName ??
                  transfer.senderId.slice(0, 8)}
              </div>
              <div className="flex-1 text-sm text-text-primary">
                {transfer.recipient?.fullName ??
                  transfer.recipientId?.slice(0, 8) ??
                  "External"}
              </div>
              <div className="w-[140px] text-sm font-medium text-accent-green">
                {formatAmount(transfer.amount)}
              </div>
              <div className="w-[80px] text-sm text-text-secondary">
                {transfer.senderCurrency}
              </div>
              <div className="w-[110px]">
                <StatusBadge status={transfer.status} />
              </div>
              <div className="w-[100px] text-xs text-text-muted">
                {timeAgo(transfer.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
      <NewTransferModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
