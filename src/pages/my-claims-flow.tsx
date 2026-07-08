import { getConfidentialTestTokenAddress } from "@tokenops/sdk";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAirdropIsSignatureValid,
  useAirdropToken,
} from "@tokenops/sdk/fhe-airdrop/react";
import { useAllow, useUserDecrypt } from "@zama-fhe/react-sdk";
import {
  ArrowUpRight,
  Check,
  Eye,
  FileKey2,
  Link2,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatUnits, parseAbi, type Address } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWalletClient,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { Button } from "../components/ui/button";
import { ConfidentialBalancePanel } from "../components/wallet/confidential-balance-panel";
import { PrivacyBadge } from "../components/ui/privacy-badge";
import {
  confidentialBalanceQueryKey,
  useConfidentialBalance,
} from "../hooks/use-confidential-balance";
import {
  claimsQueryKey,
  useClaims,
  useSyncRemoteClaims,
} from "../hooks/use-claims";
import { usePrivateClaim } from "../hooks/use-private-claim";
import {
  clearClaimImportFromLocation,
  decodeClaimImport,
  extractClaimImportPayload,
  readClaimImportFromLocation,
} from "../lib/claim-import";
import {
  importClaimForRecipient,
  markClaimClaimed,
  type SignMessageFn,
} from "../lib/claim-repository";
import { shortAddress } from "../lib/utils";
import { formatZamaError } from "../lib/zama-errors";
import type { ConfidentialClaim } from "../types/campaign";

const decimalsAbi = parseAbi(["function decimals() view returns (uint8)"]);
const demoTokenAddress = getConfidentialTestTokenAddress(sepolia.id);

export function MyClaimsFlow() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const signMessage = useCallback<SignMessageFn>(
    async (message) => {
      if (!walletClient || !address) {
        throw new Error("Connect a wallet to access your claim inbox.");
      }
      return walletClient.signMessage({ account: address, message });
    },
    [address, walletClient],
  );
  const queryClient = useQueryClient();
  const claims = useClaims(address);
  const remoteSync = useSyncRemoteClaims(address, signMessage);
  const confidentialBalance = useConfidentialBalance({
    tokenAddress: demoTokenAddress ?? undefined,
    tokenSymbol: "CTTT",
    decimals: 6,
  });
  const [importNotice, setImportNotice] = useState<string>();
  const [importError, setImportError] = useState<string>();

  useEffect(() => {
    const encoded = readClaimImportFromLocation();
    if (!encoded) return;

    const imported = decodeClaimImport(encoded);
    clearClaimImportFromLocation();

    if (!imported) {
      setImportError(
        "This claim link is invalid or expired. Ask the campaign creator for a fresh link.",
      );
      return;
    }

    if (
      address &&
      imported.recipient.toLowerCase() !== address.toLowerCase()
    ) {
      setImportError(
        `This claim link is for ${shortAddress(imported.recipient)}. Connect that recipient wallet to import it.`,
      );
      return;
    }

    importClaimForRecipient(imported);
    if (address) {
      void queryClient.invalidateQueries({ queryKey: claimsQueryKey(address) });
    }
    setImportNotice(
      `Imported "${imported.claim.campaignName}". ${address ? "Your claim is ready below." : "Connect the recipient wallet to continue."}`,
    );
  }, [address, queryClient]);

  const inbox = claims.data;
  const pendingClaims = inbox?.claims ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Recipient portal</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            Receive confidential tokens
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Direct disperse transfers appear in your balance. Airdrop campaigns
            require a claim authorization below — paste a claim link from the
            creator if nothing shows up.
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

      {isConnected && demoTokenAddress && (
        <section className="mt-8">
          <SectionHeading
            title="Direct disperse balance"
            copy="Tokens from disperse campaigns land here automatically after the creator executes."
          />
          <ConfidentialBalancePanel
            tokenAddress={demoTokenAddress}
            tokenSymbol="CTTT"
            decimals={6}
            title="Your confidential token balance"
            className="mt-4"
          />
        </section>
      )}

      {!isConnected ? (
        <EmptyClaims
          title="Connect your wallet"
          copy="Connect the recipient wallet that was added to a campaign to see pending confidential claims."
        />
      ) : claims.isLoading ? (
        <div className="mt-6 space-y-4">
          {[0, 1].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-3xl border border-white/[.06] bg-white/[.025]" />
          ))}
        </div>
      ) : claims.error ? (
        <EmptyClaims
          title="Could not load claims"
          copy="Your claims could not be loaded right now. Check your connection, stay on Sepolia, and try Refresh inbox."
          hints={[
            "If you just received an allocation, open the claim link the creator sent you.",
          ]}
        />
      ) : (
        <>
          {importNotice && (
            <div className="mt-6 rounded-xl border border-mint/20 bg-mint/[.05] p-3 text-xs leading-5 text-mint">
              {importNotice}
            </div>
          )}
          {importError && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/[.05] p-3 text-xs leading-5 text-amber-100/85"
            >
              {importError}
            </div>
          )}
          <section className="mt-10">
            <SectionHeading
              title="Airdrop claims"
              copy="Decrypt your allocation, then submit the onchain claim transaction."
            />
            <ClaimLinkImport
              recipient={address!}
              onImported={(campaignName) => {
                void queryClient.invalidateQueries({
                  queryKey: claimsQueryKey(address),
                });
                setImportNotice(
                  `Imported "${campaignName}". Your airdrop claim is ready below.`,
                );
                setImportError(undefined);
              }}
              onError={setImportError}
            />
            {remoteSync.syncError && (
              <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[.04] p-3 text-xs leading-5 text-amber-100/80">
                {remoteSync.syncError}
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {pendingClaims.length} pending{" "}
                {pendingClaims.length === 1 ? "claim" : "claims"} for{" "}
                <span className="font-mono text-slate-300">
                  {shortAddress(address)}
                </span>
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => void claims.refetch()}
                  className="text-xs font-semibold text-mint"
                >
                  Refresh inbox
                </button>
                <button
                  type="button"
                  onClick={() => void remoteSync.syncRemote()}
                  disabled={remoteSync.syncing}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-300 disabled:opacity-50"
                  title="One wallet signature to check Privlo cloud for airdrop authorizations"
                >
                  {remoteSync.syncing ? "Checking cloud…" : "Check cloud inbox"}
                </button>
              </div>
            </div>
            {pendingClaims.length ? (
              <div className="mt-3 space-y-4">
                {pendingClaims.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    recipient={address!}
                    signMessage={signMessage}
                  />
                ))}
              </div>
            ) : (
              <EmptyClaims
                title="No airdrop claims yet"
                copy="Paste the claim link the creator sent you, or ask them to run an Airdrop campaign (not Disperse). Each airdrop needs a signed authorization before you can claim."
                hints={[
                  "Use the same recipient wallet the creator added to the campaign.",
                  "After the creator executes, copy your personal claim link from their success screen.",
                  "Check cloud inbox signs once — only if the creator published to Privlo cloud.",
                ]}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  recipient,
  signMessage,
}: {
  claim: ConfidentialClaim;
  recipient: `0x${string}`;
  signMessage: SignMessageFn;
}) {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const privateClaim = usePrivateClaim({
    airdropAddress: claim.airdropAddress,
    encryptedInput: claim.encryptedInput,
    signature: claim.signature,
  });
  const [successHash, setSuccessHash] = useState<`0x${string}`>();
  const [actionError, setActionError] = useState<string>();
  const [confirmingClaim, setConfirmingClaim] = useState(false);
  const decimals = useReadContract({
    address: claim.tokenAddress,
    abi: decimalsAbi,
    functionName: "decimals",
  });
  const airdropToken = useAirdropToken({ address: claim.airdropAddress });
  const authorization = useAirdropIsSignatureValid({
    address: claim.airdropAddress,
    encryptedAmountHandle: claim.encryptedInput.handle,
    signature: claim.signature,
    caller: recipient,
  });
  const allow = useAllow();
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
    typeof decryptedValue === "bigint"
      ? decimals.data !== undefined
        ? formatUnits(decryptedValue, decimals.data)
        : `${decryptedValue.toString()} raw units`
      : undefined;
  const tokenMatches =
    airdropToken.data?.toLowerCase() === claim.tokenAddress.toLowerCase();
  const authorizationReady = authorization.data === true && tokenMatches;
  const authorizationPending =
    authorization.isLoading || airdropToken.isLoading;
  const authorizationError =
    authorization.error?.message ??
    airdropToken.error?.message ??
    (authorization.data === false
      ? "This claim is inactive, already used, or was not signed by the airdrop administrator."
      : airdropToken.data && !tokenMatches
        ? "The claim token does not match the token configured by this airdrop."
        : undefined);

  async function reveal() {
    setActionError(undefined);
    try {
      if (!privateClaim.revealedHandle) {
        await privateClaim.reveal();
      }
      await allow.mutateAsync([claim.airdropAddress]);
      await decrypt.refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? formatZamaError(error)
          : "Private reveal failed.",
      );
    }
  }

  async function submitClaim() {
    setActionError(undefined);
    setConfirmingClaim(true);
    try {
      if (!publicClient) {
        throw new Error("Sepolia RPC is unavailable.");
      }
      const hash = await privateClaim.submitClaim();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("The claim transaction reverted.");
      }
      setSuccessHash(hash);
      try {
        await markClaimClaimed({
          recipient,
          claimId: claim.id,
          transactionHash: hash,
          signMessage,
        });
      } catch {
        // Onchain claim succeeded; inbox sync can be retried on refresh.
      }
      await queryClient.invalidateQueries({ queryKey: claimsQueryKey(recipient) });
      await queryClient.invalidateQueries({
        queryKey: confidentialBalanceQueryKey(claim.tokenAddress, recipient),
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Claim transaction failed.");
    } finally {
      setConfirmingClaim(false);
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

  const revealBusy =
    privateClaim.isRevealing || allow.isPending || decrypt.isLoading;
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
        <div role="alert" className="mb-4 rounded-xl border border-rose-400/15 bg-rose-400/[.04] p-3 text-xs leading-5 text-rose-200">
          {actionError}
        </div>
      )}
      {decrypt.error && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-400/15 bg-rose-400/[.04] p-3 text-xs leading-5 text-rose-200">
          {decrypt.error.message}
        </div>
      )}
      {authorizationError && (
        <div className="mb-4 rounded-xl border border-amber-400/15 bg-amber-400/[.04] p-3 text-xs leading-5 text-amber-100/80">
          {authorizationError}
        </div>
      )}

      {!formattedAmount ? (
        <Button
          onClick={() => void reveal()}
          disabled={
            revealBusy || authorizationPending || !authorizationReady
          }
          className="h-12 w-full rounded-2xl"
        >
          {authorizationPending ? (
            <><LoaderCircle className="animate-spin" size={16} /> Validating authorization…</>
          ) : revealBusy ? (
            <><LoaderCircle className="animate-spin" size={16} /> Authorizing private reveal…</>
          ) : privateClaim.revealedHandle ? (
            <><FileKey2 size={16} /> Retry private decryption</>
          ) : (
            <><FileKey2 size={16} /> Decrypt amount</>
          )}
        </Button>
      ) : (
        <Button
          onClick={() => void submitClaim()}
          disabled={confirmingClaim || !authorizationReady}
          className="h-12 w-full rounded-2xl"
        >
          {confirmingClaim ? (
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

function SectionHeading({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold tracking-[-.02em]">
        {title}
      </h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p>
    </div>
  );
}

function ClaimLinkImport({
  recipient,
  onImported,
  onError,
}: {
  recipient: Address;
  onImported: (campaignName: string) => void;
  onError: (message: string) => void;
}) {
  const [value, setValue] = useState("");
  const [importing, setImporting] = useState(false);

  function submit() {
    onError("");
    const payload = extractClaimImportPayload(value);
    if (!payload) {
      onError("Paste a full claim link from the campaign creator.");
      return;
    }

    const imported = decodeClaimImport(payload);
    if (!imported) {
      onError("This claim link is invalid or expired.");
      return;
    }

    if (imported.recipient.toLowerCase() !== recipient.toLowerCase()) {
      onError(
        `This link is for ${shortAddress(imported.recipient)}. Connect that wallet to import it.`,
      );
      return;
    }

    setImporting(true);
    try {
      importClaimForRecipient(imported);
      onImported(imported.claim.campaignName);
      setValue("");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/[.07] bg-white/[.02] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Link2 size={15} className="text-mint" />
        Import airdrop claim link
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        The creator copies this from the success screen after funding an
        airdrop. Disperse campaigns do not generate claim links.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://privlo.vercel.app/app/claims#import=…"
          className="h-11 flex-1 rounded-xl border border-white/[.08] bg-black/25 px-3 font-mono text-xs text-slate-200 outline-none ring-mint/30 placeholder:text-slate-600 focus:ring-2"
        />
        <Button
          type="button"
          onClick={submit}
          disabled={importing || !value.trim()}
          className="h-11 shrink-0 rounded-xl px-5"
        >
          {importing ? (
            <>
              <LoaderCircle className="animate-spin" size={16} /> Importing…
            </>
          ) : (
            "Import claim"
          )}
        </Button>
      </div>
    </div>
  );
}

function EmptyClaims({
  title,
  copy,
  hints = [],
}: {
  title: string;
  copy: string;
  hints?: string[];
}) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-white/[.09] bg-white/[.015] p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[.04] text-slate-400">
        <ReceiptText size={21} />
      </span>
      <h2 className="mt-5 font-display text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{copy}</p>
      {hints.length > 0 && (
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-xs leading-6 text-slate-600">
          {hints.map((hint) => (
            <li key={hint} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-mint/60" />
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
