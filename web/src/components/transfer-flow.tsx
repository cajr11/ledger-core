"use client";

import type { Transfer } from "@ledger-core/shared";
import { formatAmount } from "@/lib/format";
import StatusBadge from "@/components/status-badge";
import Link from "next/link";
import { Landmark, User } from "lucide-react";

type Props = {
  transfer: Transfer | null;
};

const STATUS_STEPS = ["INITIATED", "PROCESSING", "COMPLETED"] as const;

function mapToStep(status: string) {
  if (["COMPLETED"].includes(status)) return 2;
  if (
    ["COLLECTING", "FUNDS_RECEIVED", "CONVERTING", "SENDING"].includes(status)
  )
    return 1;
  return 0;
}

export default function TransferFlow({ transfer }: Props) {
  if (!transfer) {
    return (
      <div className="flex flex-col gap-5 bg-bg-card border border-border-primary rounded-xl p-7">
        <h2 className="text-lg font-semibold text-text-primary">
          Transfer Flow
        </h2>
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-text-secondary">
            No transfers yet
          </p>
        </div>
      </div>
    );
  }

  const activeStep = mapToStep(transfer.status);
  const senderName =
    transfer.sender?.fullName ?? transfer.senderId.slice(0, 8);
  const recipientName =
    transfer.recipient?.fullName ??
    (transfer.recipientId?.slice(0, 8) ?? "External");

  return (
    <div className="flex flex-col bg-bg-card border border-border-primary rounded-xl p-7 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Transfer Flow
        </h2>
        <Link
          href={`/transfers/${transfer.id}`}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          Live
        </Link>
      </div>

      {/* Flow Diagram */}
      <div className="flex items-start justify-center gap-6 py-10 overflow-x-auto">
        {/* Funding Source */}
        <FlowNode
          icon={<Landmark size={18} className="text-text-muted" />}
          title="Funding Source"
          subtitle={`${transfer.senderCurrency} System Account`}
        />

        {/* Arrow */}
        <Arrow label="FUND" />

        {/* Sender */}
        <FlowNode
          icon={<User size={18} className="text-text-muted" />}
          title={senderName}
          subtitle={transfer.senderCurrency}
        />

        {/* Arrow with amount */}
        <div className="flex flex-col items-center shrink-0 pt-2 px-4">
          <div className="bg-white text-black rounded px-2.5 py-1 mb-4 whitespace-nowrap">
            <span className="text-[11px] font-bold">
              {formatAmount(transfer.amount)}
            </span>
            <span className="text-[10px] text-gray-500 ml-1">
              {transfer.senderCurrency}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-28 h-px bg-border-primary" />
            <svg width="6" height="8" className="text-border-primary -ml-px">
              <path d="M0 0 L6 4 L0 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Recipient */}
        <FlowNode
          icon={<User size={18} className="text-text-muted" />}
          title={recipientName}
          subtitle={transfer.recipientCurrency}
        />
      </div>

      {/* Fee node below */}
      {transfer.fee && Number(transfer.fee) > 0 && (
        <div className="flex flex-col items-center mt-2 mb-4">
          <span className="text-[10px] text-text-muted tracking-wider mb-1">FEE</span>
          <div className="w-px h-10 bg-border-primary" />
          <svg width="8" height="6" className="text-border-primary -mt-px">
            <path d="M0 0 L4 6 L8 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <div className="border border-border-subtle rounded-xl px-5 py-3 text-center mt-1 flex flex-col items-center gap-1.5">
            <Landmark size={16} className="text-text-muted" />
            <p className="text-sm font-medium text-text-primary">Fee Collection</p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatAmount(transfer.fee, transfer.senderCurrency)}
            </p>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="flex items-center bg-bg-primary rounded-lg px-5 py-3">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  i <= activeStep ? "bg-accent-green" : "bg-text-muted/20"
                }`}
              />
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  i <= activeStep ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {step}
              </span>
              {i === 0 && transfer.createdAt && (
                <span className="text-[10px] text-text-muted">
                  {new Date(transfer.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {i === 2 && activeStep >= 2 && transfer.updatedAt && (
                <span className="text-[10px] text-text-muted">
                  {new Date(transfer.updatedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-4 ${
                  i < activeStep ? "bg-accent-green/40" : "bg-text-muted/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowNode({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-2 border border-border-subtle rounded-xl px-8 py-6 min-w-[150px] shrink-0">
      {icon}
      <p className="text-sm font-medium text-text-primary text-center">{title}</p>
      <p className="text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center shrink-0 pt-6 px-2">
      <span className="text-[10px] text-text-muted tracking-wider mb-1">{label}</span>
      <div className="flex items-center">
        <div className="w-28 h-px bg-border-primary" />
        <svg width="6" height="8" className="text-border-primary -ml-px">
          <path d="M0 0 L6 4 L0 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
