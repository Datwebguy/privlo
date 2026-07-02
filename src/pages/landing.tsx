import {
  ArrowRight,
  BadgeCheck,
  Braces,
  CheckCircle2,
  EyeOff,
  FileKey2,
  Fingerprint,
  Gift,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/brand/logo";
import { PrivacyNetworkBackground } from "../components/effects/privacy-network-background";
import { Button } from "../components/ui/button";
import { buttonClasses } from "../components/ui/button-classes";
import { PrivacyBadge } from "../components/ui/privacy-badge";

export function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-ink text-slate-100">
      <PrivacyNetworkBackground />
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 lg:px-8">
          <Link to="/" aria-label="Privlo home"><Logo /></Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#product" className="hover:text-white">Product</a>
            <a href="#privacy" className="hover:text-white">Privacy</a>
            <a href="#how-it-works" className="hover:text-white">How it works</a>
          </nav>
          <Link
            to="/app"
            className={buttonClasses("secondary", "h-10 rounded-full")}
          >
            Launch app <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="hero-grid relative min-h-[820px] px-5 pt-44">
          <div className="relative mx-auto max-w-[1100px] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-xs text-slate-400 backdrop-blur">
              <Sparkles size={13} className="text-mint" />
              Built on Zama Protocol · Powered by TokenOps
            </div>
            <h1 className="mx-auto mt-8 max-w-4xl font-display text-[52px] font-semibold leading-[.98] tracking-[-.065em] sm:text-7xl lg:text-[92px]">
              Financial flows,
              <span className="hero-gradient block">kept private.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Encrypted payroll, investor distributions, airdrops, and vesting.
              Fully confidential onchain—from allocation to claim.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/app/campaigns/new"
                className={buttonClasses(
                  "primary",
                  "h-12 w-full rounded-full px-6 sm:w-auto",
                )}
              >
                Create private campaign <ArrowRight size={16} />
              </Link>
              <Link
                to="/app/claims"
                className={buttonClasses(
                  "secondary",
                  "h-12 w-full rounded-full px-6 sm:w-auto",
                )}
              >
                View my claims
              </Link>
            </div>

            <div className="relative mx-auto mt-20 max-w-4xl">
              <div className="hero-dashboard rounded-[28px] border border-white/[.1] bg-[#0a1013]/90 p-2 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[22px] border border-white/[.06] bg-[#0d1417] p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[.14em] text-slate-600">Private distribution</p>
                      <h3 className="mt-1 font-display text-xl font-semibold">Encrypted distribution</h3>
                    </div>
                    <PrivacyBadge />
                  </div>
                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <PreviewStat label="Recipients" value="Validated" icon={Users} />
                    <PreviewStat label="Total value" value="••••••" icon={EyeOff} />
                    <PreviewStat label="Status" value="Protected" icon={CheckCircle2} accent />
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/[.06] bg-black/20 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Encryption status</span><span className="text-mint">All inputs secured</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-500 to-mint" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -left-6 hidden rounded-2xl border border-mint/15 bg-[#0e1719]/95 p-4 text-left shadow-2xl backdrop-blur lg:block">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-mint/10 text-mint"><LockKeyhole size={17} /></span>
                  <div><p className="text-xs font-semibold">Amounts encrypted</p><p className="mt-0.5 text-[11px] text-slate-500">Visible only to each recipient</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[.06] bg-white/[.015]">
          <div className="mx-auto grid max-w-[1180px] grid-cols-2 divide-x divide-white/[.06] px-5 md:grid-cols-4">
            <TrustStat value="Zama FHE" label="Confidential compute" />
            <TrustStat value="TokenOps" label="Distribution contracts" />
            <TrustStat value="ERC-7984" label="Confidential tokens" />
            <TrustStat value="Sepolia" label="Initial network" />
          </div>
        </section>

        <section id="product" className="mx-auto max-w-[1180px] px-5 py-28 lg:px-8">
          <SectionIntro
            eyebrow="One privacy layer"
            title="Every distribution flow. None of the exposure."
            copy="Move sensitive financial operations onchain without publishing salaries, allocations, or unlock amounts to the world."
          />
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <FeatureCard icon={Send} title="Private payroll" copy="Batch encrypted contributor and team payments without exposing compensation." index="01" />
            <FeatureCard icon={Gift} title="Confidential airdrops" copy="Issue private allocations with recipient-only reveal and one-click claims." index="02" />
            <FeatureCard icon={Timer} title="Encrypted vesting" copy="Keep investor and team schedules useful onchain—and amounts unreadable." index="03" />
          </div>
        </section>

        <section id="privacy" className="px-5 pb-28 lg:px-8">
          <div className="mx-auto grid max-w-[1180px] overflow-hidden rounded-[32px] border border-white/[.07] bg-panel/65 lg:grid-cols-[1.05fr_.95fr]">
            <div className="p-8 sm:p-12 lg:p-16">
              <PrivacyBadge label="Encrypted by default" />
              <h2 className="mt-7 max-w-xl font-display text-4xl font-semibold leading-[1.08] tracking-[-.05em] sm:text-5xl">
                Public rails.
                <span className="block text-slate-500">Private financial data.</span>
              </h2>
              <p className="mt-6 max-w-lg leading-7 text-slate-500">
                Privlo uses fully homomorphic encryption so contracts can process
                distributions while amounts remain encrypted—even during computation.
              </p>
              <div className="mt-9 space-y-4">
                <PrivacyRow icon={Fingerprint} title="Recipient-controlled reveal" copy="Only the authorized wallet can decrypt its allocation." />
                <PrivacyRow icon={Braces} title="Composable onchain" copy="Encrypted flows stay programmable with TokenOps contracts." />
                <PrivacyRow icon={BadgeCheck} title="Verifiable execution" copy="Transactions remain auditable without leaking amounts." />
              </div>
            </div>
            <div className="private-panel relative grid min-h-[480px] place-items-center border-t border-white/[.06] p-8 lg:border-l lg:border-t-0">
              <div className="reveal-card relative w-full max-w-sm rounded-3xl border border-white/[.1] bg-[#0a1013]/90 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Your private claim</span>
                  <ShieldCheck size={17} className="text-mint" />
                </div>
                <div className="my-9 text-center">
                  <div className="text-xs font-semibold uppercase tracking-[.16em] text-slate-600">Amount</div>
                  <div className="mt-3 font-mono text-4xl tracking-[.1em] text-white">••••••</div>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-mint"><LockKeyhole size={12} /> Visible only to you</div>
                </div>
                <Button className="h-12 w-full rounded-2xl"><FileKey2 size={16} /> Decrypt &amp; claim</Button>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-white/[.06] bg-white/[.012] px-5 py-28 lg:px-8">
          <div className="mx-auto max-w-[1180px]">
            <SectionIntro eyebrow="Simple by design" title="Private in three steps." copy="Cryptography stays under the hood. Privlo feels like the finance software your team already knows." />
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              <Step number="01" title="Create" copy="Choose disperse, airdrop, or vesting and import your recipients." />
              <Step number="02" title="Encrypt & execute" copy="Amounts are encrypted before TokenOps submits them onchain." />
              <Step number="03" title="Privately claim" copy="Recipients authorize, decrypt, and claim from one focused screen." />
            </div>
          </div>
        </section>

        <section className="px-5 py-28 lg:px-8">
          <div className="cta-panel relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] border border-mint/10 px-6 py-20 text-center sm:px-12">
            <h2 className="relative font-display text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Ready to move privately?</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-slate-400">Launch a confidential financial flow on Sepolia in minutes.</p>
            <Link
              to="/app"
              className={buttonClasses(
                "primary",
                "relative mt-8 h-12 rounded-full px-7",
              )}
            >
              Launch Privlo <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[.06] px-5 py-8">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-xs text-slate-600">Private Financial Flows · Built on Zama + TokenOps</p>
        </div>
      </footer>
    </div>
  );
}

function PreviewStat({ label, value, icon: Icon, accent = false }: { label: string; value: string; icon: typeof Users; accent?: boolean }) {
  return <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-4 text-left"><Icon size={14} className={accent ? "text-mint" : "text-slate-600"} /><p className="mt-4 text-xs text-slate-600">{label}</p><p className={`mt-1 font-display text-lg font-semibold ${accent ? "text-mint" : ""}`}>{value}</p></div>;
}
function TrustStat({ value, label }: { value: string; label: string }) {
  return <div className="py-7 text-center"><strong className="font-display text-xl font-semibold sm:text-2xl">{value}</strong><p className="mt-1 text-[11px] text-slate-600 sm:text-xs">{label}</p></div>;
}
function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="max-w-2xl"><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-[-.05em] sm:text-5xl">{title}</h2><p className="mt-5 max-w-xl leading-7 text-slate-500">{copy}</p></div>;
}
function FeatureCard({ icon: Icon, title, copy, index }: { icon: typeof Send; title: string; copy: string; index: string }) {
  return <article className="feature-card group min-h-72 rounded-3xl border border-white/[.07] bg-panel/60 p-7"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl border border-white/[.08] bg-white/[.035] text-mint"><Icon size={19} /></span><span className="font-mono text-xs text-slate-700">{index}</span></div><h3 className="mt-20 font-display text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{copy}</p></article>;
}
function PrivacyRow({ icon: Icon, title, copy }: { icon: typeof Fingerprint; title: string; copy: string }) {
  return <div className="flex gap-4"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/[.04] text-slate-400"><Icon size={16} /></span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p></div></div>;
}
function Step({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className="border-t border-white/[.09] pt-5"><span className="font-mono text-xs text-mint">{number}</span><h3 className="mt-7 font-display text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{copy}</p></div>;
}
