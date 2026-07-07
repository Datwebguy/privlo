import {
  ArrowRight,
  CircleDollarSign,
  LockKeyhole,
  Plus,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClasses } from "../components/ui/button-classes";
import { PrivacyBadge } from "../components/ui/privacy-badge";
import { useSepoliaBlockNumber } from "../hooks/use-sepolia-block";

export function DashboardPreview() {
  const block = useSepoliaBlockNumber();

  return (
    <div>
      <section className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div>
          <PrivacyBadge label="Wallet required" />
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl">
            Move value.
            <span className="block text-slate-500">Reveal nothing else.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-500">
            Confirmed confidential distributions from your connected wallet appear here.
          </p>
        </div>
        <Link
          to="/app/campaigns/new"
          className={buttonClasses("primary", "w-full sm:w-auto")}
        >
          <Plus size={16} /> Create campaign
        </Link>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Metric
          icon={ShieldCheck}
          label="Confirmed campaigns"
          value="—"
          hint="This wallet"
        />
        <Metric
          icon={CircleDollarSign}
          label="Sepolia balance"
          value="—"
          hint="Gas available"
        />
        <Metric
          icon={Radio}
          label="Latest block"
          value={block.data?.toLocaleString() ?? "—"}
          hint={block.isFetching ? "Syncing…" : "Live Sepolia"}
        />
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="eyebrow">Campaigns</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-.03em]">
              Confirmed activity
            </h2>
          </div>
          <Link
            to="/app/claims"
            className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-white sm:flex"
          >
            My claims <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/[.09] bg-white/[.012] p-8 text-center">
          <div>
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-white/[.04] text-slate-500">
              <LockKeyhole size={19} />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">
              Connect your wallet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Use the connect button in the header. Privlo will not open any wallet
              until you choose one.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[.065] bg-white/[.018] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <Icon size={16} className="text-slate-600" />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <strong className="truncate font-display text-2xl font-semibold tracking-[-.04em]">
          {value}
        </strong>
        <span className="shrink-0 text-xs font-medium text-mint/70">{hint}</span>
      </div>
    </div>
  );
}