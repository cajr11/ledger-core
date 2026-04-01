"use client";

import type { Transfer } from "@ledger-core/shared";
import { formatAmount } from "@/lib/format";
import StatusBadge from "@/components/status-badge";
import { Landmark, User, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";

type Props = {
  transfer: Transfer | null;
};

const STATUS_STEPS = ["INITIATED", "PROCESSING", "COMPLETED"] as const;

function mapToStep(status: string) {
  if (["COMPLETED"].includes(status)) return 2;
  if (
    [
      "COLLECTING",
      "FUNDS_RECEIVED",
      "CONVERTING",
      "SENDING",
    ].includes(status)
  )
    return 1;
  return 0;
}

export default function TransferFlow({ transfer }: Props) {
  if (!transfer) {
    return (
      <div className="flex flex-col gap-5 bg-bg-card border border-border-primary rounded-xl p-7 h-[480px]">
        <h2 className="text-lg font-semibold text-text-primary">
          Transfer Flow
        </h2>
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-text-secondary">
            No transfers yet — create one to see the flow
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
  const isCrossBorder = transfer.senderCurrency !== transfer.recipientCurrency;

  return (
    <div className="flex flex-col gap-5 bg-bg-card border border-border-primary rounded-xl p-7 overflow-hidden">
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
      <div className="relative flex-1 min-h-[300px]">
        {/* Main horizontal flow */}
        <div className="flex items-start justify-between px-4 pt-8">
          {/* Funding Source */}
          <FlowNode
            icon={<Landmark size={20} className="text-text-secondary" />}
            title="Funding Source"
            subtitle={`${transfer.senderCurrency} System Account`}
          />

          {/* Arrow: FUND */}
          <div className="flex flex-col items-center justify-center mt-8 mx-2">
            <span className="text-[10px] text-text-muted mb-1 tracking-wide">
              FUND
            </span>
            <div className="flex items-center">
              <div className="w-16 h-[2px] bg-text-muted/30" />
              <ArrowRight size={14} className="text-text-muted/30 -ml-1" />
            </div>
          </div>

          {/* Sender */}
          <FlowNode
            icon={<User size={18} className="text-text-primary" />}
            title={senderName}
            subtitle={transfer.senderCurrency}
            highlighted
          />

          {/* Arrow with amount bubble */}
          <div className="flex flex-col items-center justify-center mt-4 mx-2">
            <div className="bg-white text-black rounded-md px-3 py-1.5 mb-2">
              <span className="text-sm font-bold">
                {formatAmount(transfer.amount)}
              </span>
              <span className="text-[10px] text-gray-600 ml-1">
                {transfer.senderCurrency}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-[2px] bg-text-muted/20" />
              <ArrowRight size={14} className="text-text-muted/20 -ml-1" />
            </div>
          </div>

          {/* Recipient */}
          <FlowNode
            icon={<User size={18} className="text-text-primary" />}
            title={recipientName}
            subtitle={transfer.recipientCurrency}
            highlighted
          />
        </div>

        {/* Fee arrow going down from center */}
        {transfer.fee && Number(transfer.fee) > 0 && (
          <div className="flex flex-col items-center mt-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-text-muted tracking-wide mb-1">
                FEE
              </span>
              <div className="h-8 w-[2px] bg-text-muted/15" />
              <ChevronDown size={14} className="text-text-muted/15 -mt-1" />
            </div>
            <FlowNode
              icon={<Landmark size={16} className="text-text-secondary" />}
              title="Fee Collection"
              subtitle={formatAmount(transfer.fee, transfer.senderCurrency)}
              small
            />
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="flex items-center gap-0 bg-bg-primary rounded-lg p-3 px-5">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  i <= activeStep ? "bg-accent-green" : "bg-text-muted/30"
                }`}
              />
              <span
                className={`text-[11px] font-medium ${
                  i <= activeStep ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {step}
              </span>
              {i <= activeStep && (
                <span className="text-[10px] text-text-muted ml-1">
                  {i === 0 && transfer.createdAt
                    ? new Date(transfer.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                  {i === 2 && transfer.updatedAt
                    ? new Date(transfer.updatedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              )}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-[1px] mx-3 ${
                  i < activeStep ? "bg-accent-green/40" : "bg-text-muted/15"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowNode({
  icon,
  title,
  subtitle,
  highlighted,
  small,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  highlighted?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 ${
        small ? "px-3 py-3" : "min-w-[140px]"
      } ${
        highlighted
          ? "bg-bg-card-alt border-border-primary"
          : "bg-bg-card-alt border-border-subtle"
      }`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-hover">
        {icon}
      </div>
      <span
        className={`font-medium text-text-primary ${small ? "text-xs" : "text-sm"}`}
      >
        {title}
      </span>
      <span className={`text-text-muted ${small ? "text-[10px]" : "text-xs"}`}>
        {subtitle}
      </span>
    </div>
  );
}
