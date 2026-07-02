import { useQueryClient } from "@tanstack/react-query";
import { useUserDecrypt } from "@zama-fhe/react-sdk";
import {
  ArrowUpRight,
  Check,
  Eye,
  FileKey2,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { formatUnits, parseAbi } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Button } from "../components/ui/button";
import { PrivacyBadge } from "../components/ui/privacy-badge";
import { claimsQueryKey, useClaims } from "../hooks/use-claims";
import { usePrivateClaim } from "../hooks/use-private-claim";
import { removeLocalClaim } from "../lib/claim-repository";
import { shortAddress } from "../lib/utils";
import type { ConfidentialClaim } from "../types/campaign";

const decimalsAbi = parseAbi(["function decimals() view returns (uint8)"]);

export function MyClaims() {
  const { isConnected, address } = useAccount();
  const claims = useClaims(address);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Recipient portal</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            My private claims
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Recipient-bound authorizations loaded from your encrypted claim inbox.
          </p>
        </div>
        <PrivacyBadge label="Visible only to you" />
      </div>

      <div className="mt-8 rounded-2xl border border-mint/10 bg-mint/[.035] p-4">
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint/10 text-mint">
            <ShieldCheck size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold">Private by default</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              TokenOps first grants your wallet access to the encrypted handle.
              Zama then decrypts it using a scoped wallet authorization.
            </p>
          </div>
        </div>
      </div>

      {!isConnected ? (
        <EmptyClaims
          title="Connect to find your claims"
          copy="Your inbox is queried only after a Sepolia wallet is connected."
        />
      ) : claims.isLoading ? (
        <div className="mt-6 space-y-4">
          {[0, 1].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-3xl border border-white/[.06] bg-white/[.025]" />
          ))}
        </div>
      ) : claims.error ? (
        <EmptyClaims title="Claim inbox unavailable" copy={claims.error.message} />
      ) : (
        <>
          <div className="mt-7 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {claims.data?.length ?? 0} pending for{" "}
              <span className="font-mono text-slate-300">{shortAddress(address)}</span>
            </p>
            <button onClick={() => void claims.refetch()} className="text-xs font-semibold text-mint">
              Refresh inbox
            </button>
          </div>
          {claims.data?.length ? (
            <div className="mt-3 space-y-4">
              {claims.data.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} recipient={address!} />
              ))}
            </div>
          ) : (
            <EmptyClaims
              title="No pending claims"
              copy={
                import.meta.env.VITE_PRIVLO_API_URL
                  ? "No unclaimed TokenOps authorizations were returned for this wallet."
                  : "No local authorizations exist for this wallet. Configure VITE_PRIVLO_API_URL for cross-device delivery."
              }
            />
          )}
        </>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  recipient,
}: {
  claim: ConfidentialClaim;
  recipient: `0x${string}`;
}) {
  const queryClient = useQueryClient();
  const privateClaim = usePrivateClaim({
    airdropAddress: claim.airdropAddress,
    encryptedInput: claim.encryptedInput,
    signature: claim.signature,
  });
  const [successHash, setSuccessHash] = useState<`0x${string}`>();
  const [actionError, setActionError] = useState<string>();
  const decimals = useReadContract({
    address: claim.tokenAddress,
    abi: decimalsAbi,
    functionName: "decimals",
  });
  const decrypt = useUserDecrypt(
    {
      handles: privateClaim.revealedHandle
        ? [
            {
              handle: privateClaim.revealedHandle,
              contractAddress: claim.airdropAddress,
            },
          ]
        : [],
    },
    { enabled: Boolean(privateClaim.revealedHandle) },
  );

  const decryptedValue = privateClaim.revealedHandle
    ? decrypt.data?.[privateClaim.revealedHandle]
    : undefined;
  const formattedAmount =
    typeof decryptedValue === "bigint" && decimals.data !== undefined
      ? formatUnits(decryptedValue, decimals.data)
      : undefined;

  async function reveal() {
    setActionError(undefined);
    try {
      await privateClaim.reveal();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Private reveal failed.");
    }
  }

  async function submitClaim() {
    setActionError(undefined);
    try {
      const hash = await privateClaim.submitClaim();
      setSuccessHash(hash);
      removeLocalClaim(recipient, claim.id);
      await queryClient.invalidateQueries({ queryKey: claimsQueryKey(recipient) });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Claim transaction failed.");
    }
  }

  if (successHash) {
    return (
      <article className="success-glow rounded-3xl border border-mint/20 bg-mint/[.045] p-6">
        <div className="flex flex-col items-center py-4 text-center sm:flex-row sm:text-left">
          <span className="grid size-12 place-items-center rounded-full bg-mint text-[#06241c]">
            <Check size={22} strokeWidth={3} />
          </span>
          <div className="mt-4 sm:ml-4 sm:mt-0">
            <h3 className="font-display text-lg font-semibold">Claim confirmed</h3>
            <p className="mt-1 text-sm text-slate-500">
              Confidential tokens were transferred to your wallet.
            </p>
          </div>
          <a
            className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-mint sm:ml-auto sm:mt-0"
            href={`https://sepolia.etherscan.io/tx/${successHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View transaction <ArrowUpRight size={13} />
          </a>
        </div>
      </article>
    );
  }

  const revealBusy = privateClaim.isRevealing || decrypt.isLoading;
  return (
    <article className="rounded-3xl border border-white/[.075] bg-panel/75 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-white/[.07] bg-white/[.035] text-slate-400">
            <Sparkles size={17} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{claim.campaignName}</h2>
            <p className="mt-1 font-mono text-[10px] text-slate-600">
              {shortAddress(claim.airdropAddress)}
            </p>
          </div>
        </div>
        <PrivacyBadge
          subtle={!formattedAmount}
          label={formattedAmount ? "Privately revealed" : "Encrypted"}
        />
      </div>

      <div className="my-7 rounded-2xl border border-white/[.055] bg-black/20 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-600">
          Claim amount
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          {revealBusy ? (
            <span className="h-8 w-40 animate-pulse rounded-lg bg-white/[.06]" />
          ) : (
            <div>
              <strong className="font-display text-3xl font-semibold tracking-[-.03em]">
                {formattedAmount ?? "••••••"}
              </strong>
              <span className="ml-2 text-sm text-slate-500">
                {claim.tokenSymbol ?? "tokens"}
              </span>
            </div>
          )}
          <span className="hidden items-center gap-1.5 text-[11px] text-slate-600 sm:flex">
            {formattedAmount ? <Eye size={12} /> : <LockKeyhole size={12} />}
            {formattedAmount ? "Only you can see this" : "Amount concealed"}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-xl border border-rose-400/15 bg-rose-400/[.04] p-3 text-xs leading-5 text-rose-200">
          {actionError}
        </div>
      )}
      {decrypt.error && (
        <div className="mb-4 rounded-xl border border-rose-400/15 bg-rose-400/[.04] p-3 text-xs leading-5 text-rose-200">
          {decrypt.error.message}
        </div>
      )}

      {!formattedAmount ? (
        <Button
          onClick={() => void reveal()}
          disabled={revealBusy}
          className="h-12 w-full rounded-2xl"
        >
          {revealBusy ? (
            <><LoaderCircle className="animate-spin" size={16} /> Authorizing private reveal…</>
          ) : (
            <><FileKey2 size={16} /> Decrypt amount</>
          )}
        </Button>
      ) : (
        <Button
          onClick={() => void submitClaim()}
          disabled={privateClaim.isClaiming}
          className="h-12 w-full rounded-2xl"
        >
          {privateClaim.isClaiming ? (
            <><LoaderCircle className="animate-spin" size={16} /> Confirming private claim…</>
          ) : (
            `Claim ${formattedAmount} ${claim.tokenSymbol ?? ""}`
          )}
        </Button>
      )}
      <p className="mt-3 text-center text-[11px] text-slate-600">
        Reveal and claim are separate onchain authorizations.
      </p>
    </article>
  );
}

function EmptyClaims({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-dashed border-white/[.09] bg-white/[.015] p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[.04] text-slate-400">
          <ReceiptText size={21} />
        </span>
        <h2 className="mt-5 font-display text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{copy}</p>
      </div>
    </div>
  );
}
