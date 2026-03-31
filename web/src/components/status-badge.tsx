const statusStyles: Record<string, string> = {
  COMPLETED: "bg-accent-green-bg text-accent-green",
  FUNDS_RECEIVED: "bg-accent-green-bg text-accent-green",
  INITIATED: "bg-accent-blue-bg text-accent-blue",
  COLLECTING: "bg-accent-blue-bg text-accent-blue",
  CONVERTING: "bg-accent-yellow-bg text-accent-yellow",
  SENDING: "bg-accent-yellow-bg text-accent-yellow",
  PROCESSING: "bg-accent-yellow-bg text-accent-yellow",
  FAILED: "bg-accent-red-bg text-accent-red",
  REFUNDING: "bg-accent-red-bg text-accent-red",
  REFUNDED: "bg-accent-purple-bg text-accent-purple",
  CANCELLED: "bg-accent-red-bg text-accent-red",
  // KYC statuses
  APPROVED: "bg-accent-green-bg text-accent-green",
  PENDING: "bg-accent-yellow-bg text-accent-yellow",
  REJECTED: "bg-accent-red-bg text-accent-red",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status.toUpperCase()] ?? "bg-bg-hover text-text-secondary";

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
