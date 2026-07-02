import { ArrowUpRight, Gift, Send, Timer } from "lucide-react";
import type { Campaign } from "../../types/campaign";
import { PrivacyBadge } from "../ui/privacy-badge";

const icons = { disperse: Send, airdrop: Gift, vesting: Timer };

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const Icon = icons[campaign.type];
  const createdAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(campaign.createdAt);
  return (
    <article className="group rounded-2xl border border-white/[.07] bg-panel/75 p-5 transition hover:-translate-y-0.5 hover:border-white/[.13]">
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-xl border border-white/[.07] bg-white/[.035] text-slate-300">
          <Icon size={18} />
        </span>
        <PrivacyBadge subtle />
      </div>
      <h3 className="mt-6 font-display text-[17px] font-semibold tracking-[-.02em]">
        {campaign.name}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {campaign.recipients} recipients · {campaign.tokenSymbol ?? "Confidential token"}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-white/[.06] pt-4">
        <span className="text-xs text-slate-600">{createdAt}</span>
        <a
          href={`https://sepolia.etherscan.io/tx/${campaign.transactionHash}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition group-hover:text-mint"
        >
          View transaction <ArrowUpRight size={13} />
        </a>
      </div>
    </article>
  );
}
