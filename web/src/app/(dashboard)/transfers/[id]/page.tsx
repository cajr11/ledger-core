"use client";

import { useEffect, useState, use } from "react";
import { getTransfer, getTransferHistory } from "@/lib/api";
import type { Transfer, TransferStatusHistory } from "@ledger-core/shared";
import StatusBadge from "@/components/status-badge";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, RefreshCw } from "lucide-react";
import { formatAmount } from "@/lib/format";

const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "REFUNDED", "CANCELLED"];
const POLL_INTERVAL = 3000;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type TransferWithRelations = Transfer & {
  statusHistory?: TransferStatusHistory[];
  providerEvents?: {
    id: string;
    provider: string;
    eventType: string;
    rawStatus: string;
    mappedStatus: string;
    rawPayload: Record<string, unknown>;
    receivedAt: string;
  }[];
};

export default function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [transfer, setTransfer] = useState<TransferWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const data = await getTransfer(id);
        if (active) {
          setTransfer(data as TransferWithRelations);
          setLoading(false);

          if (!TERMINAL_STATUSES.includes(data.status)) {
            timer = setTimeout(poll, POLL_INTERVAL);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load transfer"
          );
          setLoading(false);
        }
      }
    }

    poll();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-text-secondary">Loading transfer...</p>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-accent-red">{error || "Transfer not found"}</p>
        <Link href="/transfers" className="text-sm text-accent-blue hover:underline">
          Back to transfers
        </Link>
      </div>
    );
  }

  const isPolling = !TERMINAL_STATUSES.includes(transfer.status);

  return (
    <div className="flex flex-col gap-6 p-8 px-10 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/transfers"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-hover hover:bg-border-primary transition-colors"
        >
          <ArrowLeft size={16} className="text-text-secondary" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-text-primary">
              Transfer Details
            </h1>
            <StatusBadge status={transfer.status} />
            {isPolling && (
              <RefreshCw size={14} className="text-accent-blue animate-spin" />
            )}
          </div>
          <p className="text-xs text-text-muted font-mono mt-1">{transfer.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Transfer Info */}
        <div className="flex flex-col gap-4 bg-bg-card border border-border-primary rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary">Info</h2>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <Detail label="Type" value={transfer.type} />
            <Detail label="Status" value={transfer.status} />
            <Detail
              label="From"
              value={transfer.sender?.fullName ?? transfer.senderId.slice(0, 12)}
            />
            <Detail
              label="To"
              value={
                transfer.recipient?.fullName ??
                (transfer.recipientDetails
                  ? "External recipient"
                  : transfer.recipientId?.slice(0, 12) ?? "—")
              }
            />
            <Detail
              label="Amount"
              value={formatAmount(transfer.amount, transfer.senderCurrency)}
            />
            <Detail
              label="Currency"
              value={
                transfer.senderCurrency === transfer.recipientCurrency
                  ? transfer.senderCurrency
                  : `${transfer.senderCurrency} → ${transfer.recipientCurrency}`
              }
            />
            {transfer.fee && (
              <Detail
                label="Fee"
                value={formatAmount(transfer.fee, transfer.senderCurrency)}
              />
            )}
            {transfer.exchangeRate && (
              <Detail label="Exchange Rate" value={transfer.exchangeRate} />
            )}
            {transfer.convertedAmount && (
              <Detail
                label="Converted"
                value={formatAmount(transfer.convertedAmount!, transfer.recipientCurrency)}
              />
            )}
            {transfer.providerRef && (
              <Detail label="Provider Ref" value={transfer.providerRef} />
            )}
            <Detail label="Created" value={formatDate(transfer.createdAt)} />
            <Detail label="Updated" value={formatDate(transfer.updatedAt)} />
          </div>

          {transfer.recipientDetails &&
            Object.keys(transfer.recipientDetails).length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-text-secondary mb-2">
                  Recipient Details
                </p>
                <pre className="text-xs text-text-muted bg-bg-primary rounded-lg p-3 overflow-auto">
                  {JSON.stringify(transfer.recipientDetails, null, 2)}
                </pre>
              </div>
            )}

          {transfer.failureReason && (
            <div className="mt-2 p-3 bg-accent-red-bg rounded-lg">
              <p className="text-xs font-medium text-accent-red">
                Failure: {transfer.failureReason}
              </p>
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <div className="flex flex-col gap-4 bg-bg-card border border-border-primary rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary">
            Status Timeline
          </h2>

          {transfer.statusHistory && transfer.statusHistory.length > 0 ? (
            <div className="flex flex-col gap-0">
              {transfer.statusHistory.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-blue mt-1.5 shrink-0" />
                    {i < transfer.statusHistory!.length - 1 && (
                      <div className="w-px flex-1 bg-border-primary" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex flex-col gap-0.5 pb-5">
                    <div className="flex items-center gap-2">
                      {entry.fromStatus && (
                        <>
                          <StatusBadge status={entry.fromStatus} />
                          <ArrowRight size={12} className="text-text-muted" />
                        </>
                      )}
                      <StatusBadge status={entry.toStatus} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-text-muted" />
                      <span className="text-[11px] text-text-muted">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    <span className="text-[11px] text-text-muted">
                      by {entry.changedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No history yet</p>
          )}
        </div>
      </div>

      {/* Provider Events */}
      {transfer.providerEvents && transfer.providerEvents.length > 0 && (
        <div className="flex flex-col gap-4 bg-bg-card border border-border-primary rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary">
            Provider Events
          </h2>
          <div className="flex flex-col">
            {transfer.providerEvents.map((evt, i) => (
              <div
                key={evt.id}
                className={`flex items-start gap-4 py-3 ${
                  i < transfer.providerEvents!.length - 1
                    ? "border-b border-border-subtle"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">
                      {evt.eventType}
                    </span>
                    <span className="text-xs text-text-muted">
                      via {evt.provider}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary">
                      Raw: {evt.rawStatus}
                    </span>
                    <ArrowRight size={10} className="text-text-muted" />
                    <StatusBadge status={evt.mappedStatus} />
                  </div>
                </div>
                <span className="text-[11px] text-text-muted shrink-0">
                  {formatDate(evt.receivedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}
