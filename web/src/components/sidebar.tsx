"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Server,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  { href: "/system-accounts", label: "System Accounts", icon: Server },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-bg-sidebar p-4 pt-6 gap-8">
      <div className="flex items-center gap-2.5">
        <img src="/wallet.png" alt="Ledger Core" className="w-8 h-8 rounded-lg" />
        <span className="text-lg font-bold text-text-primary">Ledger Core</span>
      </div>

      <nav className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-text-secondary tracking-[1.2px] mb-2">
          NAVIGATION
        </span>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-bg-hover text-text-primary font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-text-primary" : "text-text-muted"}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
