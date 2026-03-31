export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-6 p-8 px-10 h-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold text-text-primary">Activity</h1>
        <p className="text-sm text-text-secondary">
          Full audit trail of all ledger operations
        </p>
      </div>

      <div className="flex items-center justify-center flex-1 bg-bg-card border border-border-primary rounded-xl">
        <p className="text-sm text-text-secondary">Coming soon</p>
      </div>
    </div>
  );
}
