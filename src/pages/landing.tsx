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
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/brand/logo";
import { PrivacyNetworkBackground } from "../components/effects/privacy-network-background";
import { LandingFaq } from "../components/landing/landing-faq";
import { LandingFooter } from "../components/landing/landing-footer";
import { ScrollReveal } from "../components/landing/scroll-reveal";
import { Button } from "../components/ui/button";
import { buttonClasses } from "../components/ui/button-classes";
import { PrivacyBadge } from "../components/ui/privacy-badge";
import { landingDocs } from "../lib/landing-links";
import { cn } from "../lib/utils";

const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#privacy", label: "Privacy" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
] as const;

const marqueeItems = [
  "Wrappers Registry",
  "Zama FHE",
  "ERC-7984",
  "Wrap & unwrap",
  "EIP-712 decrypt",
  "Sepolia",
  "TokenOps",
  "Confidential airdrops",
] as const;

export function Landing() {
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-slate-100">
      <PrivacyNetworkBackground />

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300",
          headerScrolled
            ? "border-b border-white/[.06] bg-ink/75 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 lg:px-8">
          <Link to="/" aria-label="Privlo home">
            <Logo />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/[.06] bg-white/[.025] p-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/[.05] hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href={landingDocs.readme}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/[.05] hover:text-white"
            >
              Docs
            </a>
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
        <section className="hero-grid relative px-5 pb-24 pt-36 sm:pt-40 lg:pb-32 lg:pt-44">
          <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-72 max-w-4xl bg-[radial-gradient(ellipse_at_center,rgba(103,247,206,.09),transparent_68%)]" />

          <div className="relative mx-auto max-w-[1100px] text-center">
            <ScrollReveal variant="fade" delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-xs text-slate-400 backdrop-blur">
                <Sparkles size={13} className="text-mint" />
                Zama Wrappers Registry · Sepolia testnet
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <h1 className="mx-auto mt-8 max-w-4xl font-display text-[46px] font-semibold leading-[.98] tracking-[-.065em] sm:text-7xl lg:text-[88px]">
                Wrap tokens.
                <span className="hero-gradient block">Reveal on your terms.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={160}>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                Browse official Sepolia wrapper pairs from the onchain registry,
                mint mock underlying tokens, wrap and unwrap ERC-7984 balances,
                and decrypt any confidential token with EIP-712 authorization.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={240}>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/app"
                  className={buttonClasses(
                    "primary",
                    "h-12 w-full rounded-full px-6 sm:w-auto",
                  )}
                >
                  Open registry <ArrowRight size={16} />
                </Link>
                <Link
                  to="/app/campaigns/new"
                  className={buttonClasses(
                    "secondary",
                    "h-12 w-full rounded-full px-6 sm:w-auto",
                  )}
                >
                  Create distribution
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={320}>
              <div className="relative mx-auto mt-20 max-w-4xl">
                <div className="hero-dashboard rounded-[28px] border border-white/[.1] bg-[#0a1013]/90 p-2 shadow-2xl backdrop-blur-xl">
                  <div className="rounded-[22px] border border-white/[.06] bg-[#0d1417] p-5 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-left">
                        <p className="text-xs uppercase tracking-[.14em] text-slate-600">
                          Campaign preview
                        </p>
                        <h3 className="mt-1 font-display text-xl font-semibold">
                          Q3 contributor distribution
                        </h3>
                      </div>
                      <PrivacyBadge />
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                      <PreviewStat
                        label="Recipients"
                        value="128 wallets"
                        icon={Users}
                      />
                      <PreviewStat
                        label="Total value"
                        value="••••••"
                        icon={EyeOff}
                      />
                      <PreviewStat
                        label="Status"
                        value="Encrypted"
                        icon={CheckCircle2}
                        accent
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/[.06] bg-black/20 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Encryption pipeline</span>
                        <span className="text-mint">Ready to execute</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                        <div className="landing-progress h-full rounded-full bg-gradient-to-r from-cyan-500 to-mint" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="landing-float-card absolute -bottom-8 -left-4 hidden rounded-2xl border border-mint/15 bg-[#0e1719]/95 p-4 text-left shadow-2xl backdrop-blur lg:block">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-mint/10 text-mint">
                      <LockKeyhole size={17} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">Amounts encrypted</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Visible only to each recipient
                      </p>
                    </div>
                  </div>
                </div>

                <div className="landing-float-card landing-float-delay absolute -right-2 top-8 hidden rounded-2xl border border-white/[.08] bg-[#0e1719]/95 p-4 text-left shadow-2xl backdrop-blur lg:block">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-white/[.05] text-slate-300">
                      <Zap size={17} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">No wallet popups</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Connect only when you choose
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-y border-white/[.06] bg-white/[.015] py-4">
          <div className="landing-marquee overflow-hidden">
            <div className="landing-marquee-track flex w-max items-center gap-10">
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="flex items-center gap-3 text-sm font-medium text-slate-500"
                >
                  <span className="size-1.5 rounded-full bg-mint/70" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-5 md:grid-cols-2">
            <ScrollReveal variant="left">
              <article className="landing-contrast-card h-full rounded-3xl border border-rose-400/10 bg-rose-400/[.03] p-8">
                <p className="eyebrow text-rose-300/80">The problem</p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-.04em]">
                  Public chains expose what teams need hidden
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  Payroll reveals compensation. Cap-table distributions expose
                  allocation sizes. Public airdrops broadcast every recipient&apos;s
                  balance to the world.
                </p>
              </article>
            </ScrollReveal>
            <ScrollReveal variant="right" delay={100}>
              <article className="landing-contrast-card h-full rounded-3xl border border-mint/15 bg-mint/[.04] p-8">
                <p className="eyebrow">The Privlo answer</p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-.04em]">
                  Verifiable flows without public amounts
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  Encrypt allocations client-side, execute with TokenOps, and let
                  each recipient privately reveal only what belongs to them.
                </p>
              </article>
            </ScrollReveal>
          </div>
        </section>

        <section id="product" className="mx-auto max-w-[1180px] px-5 py-24 lg:px-8 lg:py-28">
          <ScrollReveal>
            <SectionIntro
              eyebrow="One privacy layer"
              title="Every distribution flow. None of the exposure."
              copy="Move payroll, cap-table events, and community rewards onchain without publishing the underlying financial graph."
            />
          </ScrollReveal>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <ScrollReveal delay={0}>
              <FeatureCard
                icon={Send}
                title="Private payroll"
                copy="Batch encrypted contributor and team payments without exposing individual compensation onchain."
                index="01"
              />
            </ScrollReveal>
            <ScrollReveal delay={90}>
              <FeatureCard
                icon={Gift}
                title="Confidential airdrops"
                copy="Issue recipient-bound allocations with signed authorizations and one-click private claims."
                index="02"
              />
            </ScrollReveal>
            <ScrollReveal delay={180}>
              <FeatureCard
                icon={Timer}
                title="Encrypted vesting"
                copy="Keep unlock schedules useful onchain while amounts stay unreadable to everyone else."
                index="03"
              />
            </ScrollReveal>
          </div>
        </section>

        <section id="privacy" className="px-5 pb-24 lg:px-8 lg:pb-28">
          <div className="mx-auto grid max-w-[1180px] overflow-hidden rounded-[32px] border border-white/[.07] bg-panel/65 lg:grid-cols-[1.05fr_.95fr]">
            <ScrollReveal variant="left" className="p-8 sm:p-12 lg:p-16">
              <PrivacyBadge label="Encrypted by default" />
              <h2 className="mt-7 max-w-xl font-display text-4xl font-semibold leading-[1.08] tracking-[-.05em] sm:text-5xl">
                Public rails.
                <span className="block text-slate-500">Private financial data.</span>
              </h2>
              <p className="mt-6 max-w-lg leading-7 text-slate-500">
                Privlo uses fully homomorphic encryption so contracts can process
                distributions while amounts remain encrypted—even during
                computation.
              </p>
              <div className="mt-9 space-y-4">
                <PrivacyRow
                  icon={Fingerprint}
                  title="Recipient-controlled reveal"
                  copy="Only the authorized wallet can decrypt its allocation."
                />
                <PrivacyRow
                  icon={Braces}
                  title="Composable onchain"
                  copy="Encrypted flows stay programmable with TokenOps contracts."
                />
                <PrivacyRow
                  icon={BadgeCheck}
                  title="Verifiable execution"
                  copy="Transactions remain auditable without leaking amounts."
                />
              </div>
            </ScrollReveal>

            <ScrollReveal
              variant="right"
              delay={120}
              className="private-panel relative grid min-h-[480px] place-items-center border-t border-white/[.06] p-8 lg:border-l lg:border-t-0"
            >
              <div className="reveal-card relative w-full max-w-sm rounded-3xl border border-white/[.1] bg-[#0a1013]/90 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Your private claim</span>
                  <ShieldCheck size={17} className="text-mint" />
                </div>
                <div className="my-9 text-center">
                  <div className="text-xs font-semibold uppercase tracking-[.16em] text-slate-600">
                    Amount
                  </div>
                  <div className="mt-3 font-mono text-4xl tracking-[.1em] text-white">
                    ••••••
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-mint">
                    <LockKeyhole size={12} /> Visible only to you
                  </div>
                </div>
                <Button className="h-12 w-full rounded-2xl">
                  <FileKey2 size={16} /> Decrypt &amp; claim
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-white/[.06] bg-white/[.012] px-5 py-24 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal>
              <SectionIntro
                eyebrow="Simple by design"
                title="Private in three steps."
                copy="Cryptography stays under the hood. Privlo feels like the finance software your team already knows."
              />
            </ScrollReveal>

            <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
              <div
                aria-hidden
                className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-10 hidden h-px bg-gradient-to-r from-transparent via-mint/25 to-transparent md:block"
              />
              <ScrollReveal delay={0}>
                <Step
                  number="01"
                  title="Create"
                  copy="Choose disperse, airdrop, or vesting. Import recipients and validate allocations before anything hits the chain."
                />
              </ScrollReveal>
              <ScrollReveal delay={120}>
                <Step
                  number="02"
                  title="Encrypt & execute"
                  copy="Amounts are encrypted in the browser, then TokenOps submits confidential contracts on Sepolia."
                />
              </ScrollReveal>
              <ScrollReveal delay={240}>
                <Step
                  number="03"
                  title="Privately claim"
                  copy="Recipients connect, decrypt only their allocation, and claim from a single focused screen."
                />
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "Zama FHE", label: "Confidential compute" },
              { value: "TokenOps", label: "Distribution contracts" },
              { value: "ERC-7984", label: "Confidential tokens" },
              { value: "Sepolia", label: "Live testnet" },
            ].map((stat, index) => (
              <ScrollReveal key={stat.value} delay={index * 60}>
                <TrustStat value={stat.value} label={stat.label} />
              </ScrollReveal>
            ))}
          </div>
        </section>

        <LandingFaq />

        <section className="px-5 pb-28 lg:px-8">
          <ScrollReveal variant="scale">
            <div className="cta-panel relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] border border-mint/10 px-6 py-20 text-center sm:px-12">
              <h2 className="relative font-display text-4xl font-semibold tracking-[-.05em] sm:text-6xl">
                Ready to try confidential tokens?
              </h2>
              <p className="relative mx-auto mt-5 max-w-xl text-slate-400">
                Connect on Sepolia, browse wrapper pairs, mint mocks, wrap
                balances, and reveal only what you authorize — all from one
                open-source app.
              </p>
              <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/app"
                  className={buttonClasses("primary", "h-12 rounded-full px-7")}
                >
                  Launch Privlo <ArrowRight size={16} />
                </Link>
                <a
                  href={landingDocs.howToUse}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses("secondary", "h-12 rounded-full px-7")}
                >
                  Read documentation
                </a>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function PreviewStat({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-4 text-left">
      <Icon size={14} className={accent ? "text-mint" : "text-slate-600"} />
      <p className="mt-4 text-xs text-slate-600">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-lg font-semibold",
          accent && "text-mint",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-white/[.02] py-8 text-center">
      <strong className="font-display text-xl font-semibold sm:text-2xl">
        {value}
      </strong>
      <p className="mt-1 text-[11px] text-slate-600 sm:text-xs">{label}</p>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-[-.05em] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 max-w-xl leading-7 text-slate-500">{copy}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  copy,
  index,
}: {
  icon: typeof Send;
  title: string;
  copy: string;
  index: string;
}) {
  return (
    <article className="feature-card group min-h-72 rounded-3xl border border-white/[.07] bg-panel/60 p-7">
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-2xl border border-white/[.08] bg-white/[.035] text-mint">
          <Icon size={19} />
        </span>
        <span className="font-mono text-xs text-slate-700">{index}</span>
      </div>
      <h3 className="mt-20 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{copy}</p>
    </article>
  );
}

function PrivacyRow({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Fingerprint;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/[.04] text-slate-400">
        <Icon size={16} />
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="relative rounded-3xl border border-white/[.07] bg-panel/50 p-7 md:border-0 md:bg-transparent md:p-0 md:pt-5">
      <span className="inline-flex size-10 items-center justify-center rounded-full border border-mint/20 bg-mint/[.06] font-mono text-xs text-mint">
        {number}
      </span>
      <h3 className="mt-6 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{copy}</p>
    </div>
  );
}