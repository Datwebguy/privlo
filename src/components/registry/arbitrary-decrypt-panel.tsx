import { isAddress, type Address } from "viem";
import { useState } from "react";
import { Eye, Search } from "lucide-react";
import { ConfidentialBalancePanel } from "../wallet/confidential-balance-panel";
import { Button } from "../ui/button";

export function ArbitraryDecryptPanel() {
  const [input, setInput] = useState("");
  const [active, setActive] = useState<Address>();
  const valid = isAddress(input);
  const preview = valid ? (input as Address) : undefined;

  return (
    <section className="rounded-3xl border border-white/[.07] bg-panel/70 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-200">
          <Eye size={18} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-[-.03em]">
            Decrypt any ERC-7984 balance
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Paste any confidential token contract on Sepolia. Privlo reads your
            encrypted handle and runs the EIP-712 user-decryption flow — not
            limited to registry pairs.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="0x confidential token address"
          className="field-input h-11 flex-1 font-mono text-xs"
          maxLength={42}
        />
        <Button
          className="h-11 shrink-0 rounded-xl px-5"
          disabled={!preview}
          onClick={() => preview && setActive(preview)}
        >
          <Search size={15} />
          Load token
        </Button>
      </div>

      {input && !valid && (
        <p className="mt-3 text-xs text-rose-300">Enter a valid address.</p>
      )}

      {active && (
        <div className="mt-6">
          <ConfidentialBalancePanel
            tokenAddress={active}
            title="Arbitrary token balance"
          />
        </div>
      )}
    </section>
  );
}