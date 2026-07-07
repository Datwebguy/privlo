import { ArrowUpRight, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../brand/logo";
import { GITHUB_REPO, landingDocs } from "../../lib/landing-links";

const productLinks = [
  { label: "Registry", to: "/app" },
  { label: "Campaigns", to: "/app/campaigns" },
  { label: "Create campaign", to: "/app/campaigns/new" },
  { label: "My claims", to: "/app/claims" },
] as const;

const documentLinks = [
  { label: "README", href: landingDocs.readme },
  { label: "How to use", href: landingDocs.howToUse },
  { label: "Quick start", href: landingDocs.quickStart },
  { label: "Claim inbox API", href: landingDocs.claimInbox },
  { label: "Architecture", href: landingDocs.architecture },
  { label: "Protocol integration", href: landingDocs.protocol },
] as const;

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[.06] bg-[#080c0e]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_.9fr_.9fr]">
          <div>
            <Link to="/" aria-label="Privlo home">
              <Logo />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
              <span className="font-semibold text-slate-300">Privlo</span> —
              browse the Zama Wrappers Registry on Sepolia, wrap and unwrap
              ERC-7984 pairs, and decrypt balances — plus confidential
              distributions powered by TokenOps.
            </p>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-mint/25 hover:text-white"
            >
              <Github size={16} />
              View on GitHub
              <ArrowUpRight size={14} className="text-slate-500" />
            </a>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">
              Product
            </h3>
            <ul className="mt-5 space-y-3">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 transition hover:text-mint"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">
              Documentation
            </h3>
            <ul className="mt-5 space-y-3">
              {documentLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-mint"
                  >
                    {link.label}
                    <ArrowUpRight size={12} className="opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[.06] pt-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Privlo · Private Financial Flows</p>
          <p className="text-slate-700">
            Built on{" "}
            <span className="text-slate-500">Zama Protocol</span> +{" "}
            <span className="text-slate-500">TokenOps</span> · Sepolia testnet
          </p>
        </div>
      </div>
    </footer>
  );
}