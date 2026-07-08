import {
  CircleHelp,
  FilePlus2,
  LayoutGrid,
  ReceiptText,
  Shield,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "../brand/logo";
import { PrivacyNetworkBackground } from "../effects/privacy-network-background";
import { cn } from "../../lib/utils";
import { ConnectButton } from "../wallet/connect-button";
import { FheWarmupIndicator } from "./fhe-warmup-indicator";

const navigation = [
  { to: "/app", label: "Registry", icon: Shield, end: true },
  { to: "/app/campaigns", label: "Campaigns", icon: LayoutGrid },
  { to: "/app/campaigns/new", label: "Create", icon: FilePlus2 },
  { to: "/app/claims", label: "Receive", icon: ReceiptText },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <PrivacyNetworkBackground />
      <header className="sticky top-0 z-40 border-b border-white/[.06] bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
          <NavLink
            to="/"
            aria-label="Privlo home"
            className="flex items-center gap-3"
          >
            <Logo />
            <span className="hidden text-[9px] font-semibold uppercase tracking-[.2em] text-slate-600 lg:block">
              Private financial flows
            </span>
          </NavLink>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/[.06] bg-white/[.025] p-1 md:flex">
            {navigation.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-white/[.08] text-white"
                      : "text-slate-500 hover:text-slate-200",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <FheWarmupIndicator />
            <a
              href="https://github.com/Datwebguy/privlo#how-to-use-privlo"
              target="_blank"
              rel="noreferrer"
              aria-label="Open Privlo help documentation"
              className="hidden size-10 place-items-center rounded-full text-slate-500 hover:bg-white/5 sm:grid"
            >
              <CircleHelp size={18} />
            </a>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1280px] px-5 pb-28 pt-8 md:pb-8 lg:px-8 lg:py-12">
        <Outlet />
      </main>

      <nav className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-2xl border border-white/10 bg-[#0d1316]/95 p-2 shadow-2xl backdrop-blur-xl md:hidden">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-w-20 flex-col items-center gap-1 rounded-xl py-2 text-[11px]",
                isActive ? "bg-mint/10 text-mint" : "text-slate-500",
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
