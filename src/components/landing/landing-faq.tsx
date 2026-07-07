import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "./scroll-reveal";

const faqItems = [
  {
    question: "What is Privlo?",
    answer:
      "Privlo is a confidential distribution layer for onchain organizations. Teams create payroll, airdrop, or vesting campaigns, encrypt each allocation in the browser, and execute through TokenOps on Sepolia. Recipients claim privately from their own wallet.",
  },
  {
    question: "How does confidentiality work?",
    answer:
      "Amounts are encrypted with Zama fully homomorphic encryption before they reach the chain. Contracts process distributions on ciphertext, and only the authorized recipient wallet can decrypt its own allocation when claiming.",
  },
  {
    question: "Which wallets and networks are supported?",
    answer:
      "Privlo runs on Ethereum Sepolia today. You can connect MetaMask, Phantom, or other EIP-1193 wallets, plus WalletConnect. Privlo does not open any wallet until you explicitly click Connect.",
  },
  {
    question: "What campaign types can I create?",
    answer:
      "Creators can run confidential disperse batches, funded airdrops with recipient-bound authorizations, and vesting-style flows. Each path uses TokenOps pre-deployed confidential contracts and ERC-7984 test tokens on Sepolia.",
  },
  {
    question: "Do recipients need a Privlo account?",
    answer:
      "No separate account is required. Recipients connect a wallet, open My claims, and decrypt only the allocations addressed to them. Signed claim messages can also sync through the Privlo claim inbox API.",
  },
  {
    question: "Is plaintext ever published onchain?",
    answer:
      "Privlo is designed so allocation amounts stay encrypted from campaign creation through claim. Transactions remain verifiable without exposing individual compensation or allocation sizes to the public ledger.",
  },
  {
    question: "Is this production-ready?",
    answer:
      "Privlo is built for real confidential flows on Sepolia, not a mock UI. It is still an early network deployment: use test funds, review the README security boundaries, and configure Supabase for cross-device claim delivery in production.",
  },
] as const;

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="px-5 py-28 lg:px-8">
      <div className="mx-auto max-w-[860px]">
        <ScrollReveal>
          <p className="eyebrow text-center">FAQ</p>
          <h2 className="mt-3 text-center font-display text-4xl font-semibold leading-[1.08] tracking-[-.05em] sm:text-5xl">
            Questions before you launch
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-7 text-slate-500 sm:text-base">
            Everything teams usually ask about privacy, wallets, and getting a
            confidential flow live on Sepolia.
          </p>
        </ScrollReveal>

        <div className="mt-12 space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <ScrollReveal key={item.question} delay={index * 70}>
                <article className="overflow-hidden rounded-2xl border border-white/[.07] bg-panel/55 transition-colors hover:border-white/[.11]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenIndex((current) =>
                        current === index ? null : index,
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  >
                    <span className="font-display text-base font-semibold tracking-[-.02em] text-white sm:text-lg">
                      {item.question}
                    </span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        "shrink-0 text-slate-500 transition-transform duration-300",
                        isOpen && "rotate-180 text-mint",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-7 text-slate-500 sm:px-6">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}