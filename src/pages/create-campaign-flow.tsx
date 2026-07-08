import { useQueryClient } from "@tanstack/react-query";
import {
  getConfidentialTestTokenAddress,
  requireFheAirdropFactoryAddress,
  requireFheDisperseSingletonAddress,
} from "@tokenops/sdk";
import {
  encryptUint64,
  signClaimAuthorization,
} from "@tokenops/sdk/fhe-airdrop";
import { erc7984OperatorAbi, setOperator } from "@tokenops/sdk/fhe";
import { useCreateAndFundConfidentialAirdropAndGetAddress } from "@tokenops/sdk/fhe-airdrop/react";
import {
  useDisperse,
  usePreflightDisperse,
} from "@tokenops/sdk/fhe-disperse/react";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import type { RelayerWeb } from "@zama-fhe/sdk";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  Gift,
  LoaderCircle,
  Plus,
  Send,
  ShieldCheck,
  Timer,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAddress,
  isAddress,
  keccak256,
  parseAbi,
  parseUnits,
  toBytes,
  type Address,
} from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWalletClient,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { Button } from "../components/ui/button";
import { TestTokenFaucet } from "../components/campaign/test-token-faucet";
import { ConfidentialBalancePanel } from "../components/wallet/confidential-balance-panel";
import { PrivacyBadge } from "../components/ui/privacy-badge";
import { campaignQueryKey } from "../hooks/use-campaigns";
import { confidentialBalanceQueryKey } from "../hooks/use-confidential-balance";
import { usePrivloFheWarmup } from "../providers/fhe-warmup-provider";
import {
  runDisperseWithEncryptRetry,
  runEncryptWithRetry,
} from "../lib/disperse-encrypt";
import { formatExecutionError } from "../lib/zama-errors";

import { saveCampaign } from "../lib/campaign-repository";
import { buildClaimImportUrl } from "../lib/claim-import";
import {
  publishClaims,
  saveLocalClaims,
} from "../lib/claim-repository";
import { shortAddress } from "../lib/utils";
import {
  MAX_AMOUNT_INPUT_LENGTH,
  MAX_CAMPAIGN_NAME_LENGTH,
  MAX_CSV_BYTES,
  MAX_RECIPIENTS,
} from "../lib/runtime-validation";
import { cn } from "../lib/utils";
import type {
  Campaign,
  CampaignType,
  RecipientAllocation,
} from "../types/campaign";

const metadataAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

const defaultToken = getConfidentialTestTokenAddress(sepolia.id) ?? "";
const MAX_UINT64 = (1n << 64n) - 1n;

const campaignTypes = [
  {
    id: "disperse" as const,
    icon: Send,
    title: "Disperse",
    description: "Immediate encrypted payroll and contributor payments.",
  },
  {
    id: "airdrop" as const,
    icon: Gift,
    title: "Airdrop",
    description: "Fund a private pool and issue recipient claim authorizations.",
  },
  {
    id: "vesting" as const,
    icon: Timer,
    title: "Simple vesting",
    description: "Encrypted time-based allocations.",
    disabled: true,
  },
];

type PreparedRecipient = {
  address: Address;
  amount: bigint;
  displayAmount: string;
};

function newRecipient(): RecipientAllocation {
  return { id: crypto.randomUUID(), address: "" as Address, amount: "" };
}

function localInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(timestamp - offset).toISOString().slice(0, 16);
}

type NormalizeAmountResult =
  | { ok: true; amountInput: string }
  | { ok: false; error: string };

function normalizeAmountInput(
  value: string,
  decimals: number,
): NormalizeAmountResult {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return { ok: false, error: "needs an amount." };
  if (normalized.length > MAX_AMOUNT_INPUT_LENGTH) {
    return {
      ok: false,
      error: `amount must be ${MAX_AMOUNT_INPUT_LENGTH} characters or fewer.`,
    };
  }
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return {
      ok: false,
      error: "amount must be a number, for example 100 or 100.25.",
    };
  }
  const [, fractional = ""] = normalized.split(".");
  if (fractional.length > decimals) {
    return {
      ok: false,
      error: `amount has too many decimal places. This token supports ${decimals}.`,
    };
  }
  return { ok: true, amountInput: normalized };
}

function prepareRecipients(
  rows: RecipientAllocation[],
  decimals?: number,
): { recipients: PreparedRecipient[]; errors: string[] } {
  if (decimals === undefined) {
    return { recipients: [], errors: ["Token decimals are not available."] };
  }

  const errors: string[] = [];
  const seen = new Set<string>();
  const recipients: PreparedRecipient[] = [];

  if (rows.length > MAX_RECIPIENTS) {
    return {
      recipients: [],
      errors: [`Campaigns support at most ${MAX_RECIPIENTS} recipients.`],
    };
  }

  rows.forEach((row, index) => {
    const label = `Recipient ${index + 1}`;
    if (!isAddress(row.address)) {
      errors.push(`${label} has an invalid address.`);
      return;
    }
    const address = getAddress(row.address);
    const normalized = address.toLowerCase();
    if (seen.has(normalized)) {
      errors.push(`${label} duplicates an earlier address.`);
      return;
    }
    seen.add(normalized);

    const parsed = normalizeAmountInput(row.amount, decimals);
    if (!parsed.ok) {
      errors.push(`${label} ${parsed.error}`);
      return;
    }

    try {
      const amountInput = parsed.amountInput;
      const amount = parseUnits(amountInput, decimals);
      if (amount <= 0n) {
        errors.push(`${label} amount must be greater than zero.`);
        return;
      }
      if (amount > MAX_UINT64) {
        errors.push(`${label} amount is too large for TokenOps encrypted uint64 amounts.`);
        return;
      }
      recipients.push({ address, amount, displayAmount: amountInput });
    } catch {
      errors.push(`${label} amount could not be parsed for this token.`);
    }
  });

  if (!rows.length) errors.push("Add at least one recipient.");
  return { recipients, errors };
}

export function CreateCampaignFlow() {
  const { address } = useAccount();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<CampaignType>("disperse");
  const [name, setName] = useState("");
  const [tokenAddress, setTokenAddress] = useState(defaultToken);
  const [recipientAttemptedContinue, setRecipientAttemptedContinue] =
    useState(false);
  const [recipients, setRecipients] = useState<RecipientAllocation[]>([
    newRecipient(),
  ]);
  const [csvError, setCsvError] = useState<string>();
  const [startTime, setStartTime] = useState(() =>
    localInputValue(Date.now() + 5 * 60_000),
  );
  const [endTime, setEndTime] = useState(() =>
    localInputValue(Date.now() + 30 * 24 * 60 * 60_000),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const validToken = isAddress(tokenAddress);

  const tokenMetadata = useReadContracts({
    contracts: validToken
      ? [
          { address: tokenAddress, abi: metadataAbi, functionName: "name", chainId: sepolia.id },
          { address: tokenAddress, abi: metadataAbi, functionName: "symbol", chainId: sepolia.id },
          { address: tokenAddress, abi: metadataAbi, functionName: "decimals", chainId: sepolia.id },
        ]
      : [],
    allowFailure: false,
    query: { enabled: validToken },
  });

  const metadata = tokenMetadata.data
    ? {
        name: tokenMetadata.data[0] as string,
        symbol: tokenMetadata.data[1] as string,
        decimals: tokenMetadata.data[2] as number,
      }
    : undefined;

  const prepared = useMemo(
    () => prepareRecipients(recipients, metadata?.decimals),
    [recipients, metadata?.decimals],
  );
  const recipientSymbol = metadata?.symbol ?? "token";
  const usingTokenOpsDemoToken =
    Boolean(defaultToken) &&
    validToken &&
    tokenAddress.toLowerCase() === defaultToken.toLowerCase();
  const campaignTotal = prepared.recipients.reduce(
    (sum, recipient) => sum + recipient.amount,
    0n,
  );
  const warmupContract = useMemo(() => {
    if (type === "vesting") return undefined;
    return type === "airdrop"
      ? requireFheAirdropFactoryAddress(sepolia.id)
      : requireFheDisperseSingletonAddress(sepolia.id);
  }, [type]);
  const fhe = usePrivloFheWarmup(warmupContract);

  const detailValid =
    name.trim().length >= 3 &&
    name.trim().length <= MAX_CAMPAIGN_NAME_LENGTH &&
    validToken &&
    Boolean(metadata) &&
    (type !== "airdrop" ||
      (Date.parse(startTime) > Date.now() && Date.parse(endTime) > Date.parse(startTime)));

  function updateRecipient(
    id: string,
    field: "address" | "amount",
    value: string,
  ) {
    setRecipientAttemptedContinue(false);
    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === id ? { ...recipient, [field]: value } : recipient,
      ),
    );
  }

  async function importCsv(file?: File) {
    if (!file) return;
    setCsvError(undefined);
    try {
      if (file.size > MAX_CSV_BYTES) {
        throw new Error("CSV files must be 1 MB or smaller.");
      }
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const dataLines = lines[0]?.toLowerCase().includes("address")
        ? lines.slice(1)
        : lines;
      if (dataLines.length > MAX_RECIPIENTS) {
        throw new Error(
          `CSV files support at most ${MAX_RECIPIENTS} recipients.`,
        );
      }
      const imported = dataLines.map((line, index) => {
        const [address = "", amount = ""] = line
          .split(",")
          .map((value) => value.trim().replace(/^"|"$/g, ""));
        if (!address || !amount) {
          throw new Error(`CSV row ${index + 1} needs address and amount.`);
        }
        return { id: crypto.randomUUID(), address: address as Address, amount };
      });
      if (!imported.length) throw new Error("The CSV has no recipient rows.");
      setRecipients(imported);
      setRecipientAttemptedContinue(false);
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "Could not read CSV.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const steps = ["Type", "Details", "Recipients", "Review"];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/app/campaigns"
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"
      >
        <ArrowLeft size={15} /> Back to campaigns
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">New campaign</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            Create a confidential flow
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Every amount is encrypted before the TokenOps transaction is submitted.
          </p>
        </div>
        <PrivacyBadge label="Sepolia · encrypted" />
      </div>

      <div className="mt-10 flex items-center gap-2">
        {steps.map((label, index) => (
          <button
            key={label}
            onClick={() => index < step && setStep(index)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                index <= step ? "bg-mint text-[#06241c]" : "bg-white/[.05] text-slate-600",
              )}
            >
              {index < step ? <Check size={12} strokeWidth={3} /> : index + 1}
            </span>
            <span className={cn("hidden text-xs sm:block", index <= step ? "text-white" : "text-slate-600")}>
              {label}
            </span>
            {index < 3 && <span className="h-px flex-1 bg-white/[.07]" />}
          </button>
        ))}
      </div>

      {step === 0 && (
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {campaignTypes.map(({ id, icon: Icon, title, description, disabled }) => (
            <button
              key={id}
              disabled={disabled}
              onClick={() => setType(id)}
              className={cn(
                "relative min-h-52 rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
                type === id
                  ? "border-mint/40 bg-mint/[.055] shadow-glow"
                  : "border-white/[.07] bg-panel/70 hover:border-white/[.14]",
              )}
            >
              {disabled && (
                <span className="absolute right-4 top-4 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  Next release
                </span>
              )}
              <span className={cn("grid size-10 place-items-center rounded-xl", type === id ? "bg-mint/15 text-mint" : "bg-white/[.04] text-slate-400")}>
                <Icon size={18} />
              </span>
              <h2 className="mt-7 font-display text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </button>
          ))}
        </section>
      )}

      {step === 1 && (
        <section className="mt-8 space-y-5 rounded-3xl border border-white/[.07] bg-panel/70 p-6 sm:p-8">
          <Field label="Campaign name">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_CAMPAIGN_NAME_LENGTH}
              placeholder="Internal campaign label"
              className="field-input"
            />
          </Field>
          <Field label="ERC-7984 confidential token">
            <input
              value={tokenAddress}
              onChange={(event) => setTokenAddress(event.target.value)}
              maxLength={42}
              placeholder="0x…"
              className="field-input font-mono"
            />
            {validToken && tokenMetadata.isLoading && <FieldHint>Reading token metadata…</FieldHint>}
            {metadata && (
              <FieldHint positive>
                {metadata.name} ({metadata.symbol}) · {metadata.decimals} decimals
              </FieldHint>
            )}
            {usingTokenOpsDemoToken && (
              <FieldHint>
                This is the TokenOps Sepolia demo confidential token (CTTT). It
                is not Sepolia ETH — mint CTTT below to fund your distribution.
              </FieldHint>
            )}
            {tokenMetadata.isError && <FieldHint error>This address does not expose valid token metadata.</FieldHint>}
          </Field>
          {address && metadata && (
            <ConfidentialBalancePanel
              tokenAddress={getAddress(tokenAddress)}
              tokenSymbol={metadata.symbol}
              decimals={metadata.decimals}
              title="Your distribution token balance"
            />
          )}
          {usingTokenOpsDemoToken && address && metadata && (
            <TestTokenFaucet
              recipient={address}
              tokenSymbol={metadata.symbol}
              decimals={metadata.decimals}
            />
          )}
          {usingTokenOpsDemoToken && !address && (
            <p className="rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3 text-xs leading-6 text-slate-500">
              Connect your wallet to mint test {metadata?.symbol ?? "CTTT"}. Sepolia
              ETH from a faucet is still required for gas.
            </p>
          )}
          {type === "airdrop" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Claims open">
                <input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="field-input" />
              </Field>
              <Field label="Claims close">
                <input type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="field-input" />
              </Field>
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="mt-8 space-y-5">
          {address && metadata && (
            <ConfidentialBalancePanel
              tokenAddress={getAddress(tokenAddress)}
              tokenSymbol={metadata.symbol}
              decimals={metadata.decimals}
              requiredAmount={campaignTotal > 0n ? campaignTotal : undefined}
              title="Balances before you send"
            />
          )}
          {usingTokenOpsDemoToken && address && metadata && (
            <TestTokenFaucet
              recipient={address}
              campaignTotal={campaignTotal}
              tokenSymbol={metadata.symbol}
              decimals={metadata.decimals}
            />
          )}
          <div className="rounded-2xl border border-dashed border-white/[.11] bg-white/[.015] p-5">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => void importCsv(event.target.files?.[0])}
            />
            <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-4 text-left">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[.04] text-slate-400"><Upload size={18} /></span>
              <span>
                <strong className="block text-sm">Import recipient CSV</strong>
                <span className="mt-1 block text-xs text-slate-600">Columns: address, amount</span>
              </span>
              <FileSpreadsheet className="ml-auto text-slate-700" size={20} />
            </button>
            {csvError && <FieldHint error>{csvError}</FieldHint>}
          </div>

          <div className="mt-5 space-y-3">
            {recipients.map((recipient, index) => (
              <div key={recipient.id} className="grid gap-3 rounded-2xl border border-white/[.065] bg-panel/65 p-4 sm:grid-cols-[1fr_180px_36px]">
                <input
                  aria-label={`Recipient ${index + 1} address`}
                  value={recipient.address}
                  onChange={(event) => updateRecipient(recipient.id, "address", event.target.value)}
                  placeholder="0x recipient address"
                  className="field-input h-11 font-mono text-xs"
                />
                <div className="relative">
                  <input
                    aria-label={`Recipient ${index + 1} amount`}
                    value={recipient.amount}
                    onChange={(event) => updateRecipient(recipient.id, "amount", event.target.value)}
                    placeholder={`Amount in ${recipientSymbol}`}
                    inputMode="decimal"
                    maxLength={MAX_AMOUNT_INPUT_LENGTH}
                    className="field-input h-11 pr-14"
                  />
                  <span className="absolute right-3 top-3.5 text-[10px] text-slate-600">
                    {recipientSymbol}
                  </span>
                </div>
                <button
                  aria-label={`Remove recipient ${index + 1}`}
                  disabled={recipients.length === 1}
                  onClick={() => setRecipients((current) => current.filter((row) => row.id !== recipient.id))}
                  className="grid size-9 place-items-center self-center rounded-lg text-slate-600 hover:bg-rose-400/5 hover:text-rose-300 disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            disabled={recipients.length >= MAX_RECIPIENTS}
            onClick={() =>
              setRecipients((current) => [...current, newRecipient()])
            }
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-mint disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} /> Add recipient
          </button>

          {recipientAttemptedContinue && prepared.errors.length > 0 && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[.04] p-4 text-xs text-amber-100/70"
            >
              {prepared.errors.map((error) => (
                <p key={error}>• {error}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 3 && metadata && (
        <section className="mt-8 space-y-5">
          {address && (
            <ConfidentialBalancePanel
              tokenAddress={getAddress(tokenAddress)}
              tokenSymbol={metadata.symbol}
              decimals={metadata.decimals}
              requiredAmount={campaignTotal > 0n ? campaignTotal : undefined}
              title="Final balance check"
            />
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <ReviewItem label="Flow" value={type === "airdrop" ? "Confidential airdrop" : "Direct disperse"} />
            <ReviewItem label="Recipients" value={String(prepared.recipients.length)} />
            <ReviewItem label="Token" value={`${metadata.symbol} · ${metadata.decimals} decimals`} />
          </div>
          {type === "airdrop" ? (
            <AirdropExecution
              name={name.trim()}
              token={getAddress(tokenAddress)}
              tokenSymbol={metadata.symbol}
              decimals={metadata.decimals}
              recipients={prepared.recipients}
              startTimestamp={Math.floor(Date.parse(startTime) / 1000)}
              endTimestamp={Math.floor(Date.parse(endTime) / 1000)}
              fhe={fhe}
            />
          ) : (
            <DisperseExecution
              name={name.trim()}
              token={getAddress(tokenAddress)}
              tokenSymbol={metadata.symbol}
              decimals={metadata.decimals}
              recipients={prepared.recipients}
              fhe={fhe}
            />
          )}
        </section>
      )}

      {step < 3 && (
        <div className="mt-8 flex justify-between">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => {
              if (step === 2) setRecipientAttemptedContinue(false);
              setStep((current) => current - 1);
            }}
          >
            Back
          </Button>
          <Button
            disabled={step === 1 && !detailValid}
            onClick={() => {
              if (step === 2) {
                setRecipientAttemptedContinue(true);
                if (prepared.errors.length > 0) return;
              }
              setStep((current) => current + 1);
            }}
          >
            Continue <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

function DisperseExecution({
  name,
  token,
  tokenSymbol,
  decimals,
  recipients,
  fhe,
}: {
  name: string;
  token: Address;
  tokenSymbol: string;
  decimals: number;
  recipients: PreparedRecipient[];
  fhe: ReturnType<typeof usePrivloFheWarmup>;
}) {
  const { address } = useAccount();
  const zamaSDK = useZamaSDK();
  const singleton = requireFheDisperseSingletonAddress(sepolia.id);
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const wallet = useWalletClient({ chainId: sepolia.id });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string>();
  const [encryptAttempt, setEncryptAttempt] = useState(0);
  const amounts = useMemo(() => recipients.map((recipient) => recipient.amount), [recipients]);
  const total = amounts.reduce((sum, amount) => sum + amount, 0n);
  const addresses = useMemo(() => recipients.map((recipient) => recipient.address), [recipients]);

  const preflight = usePreflightDisperse({
    user: address,
    token,
    recipients: addresses,
    amounts,
    mode: "direct",
  });
  const disperse = useDisperse({
    encryptor: () => zamaSDK.relayer,
  });

  async function approve() {
    if (!publicClient || !wallet.data || !address) return;
    setError(undefined);
    setApproving(true);
    try {
      await setOperator({
        publicClient,
        walletClient: wallet.data,
        account: address,
        token,
        spender: singleton,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 60),
      });
      await preflight.refetch();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Operator approval failed.");
    } finally {
      setApproving(false);
    }
  }

  async function execute() {
    if (!address || !wallet.data) return;
    setError(undefined);
    setEncryptAttempt(0);
    try {
      await fhe.ensureReady();
      const [activeAccount] = await wallet.data.getAddresses();
      if (!activeAccount || activeAccount.toLowerCase() !== address.toLowerCase()) {
        throw new Error(
          "The active wallet changed. Reconnect the original creator before continuing.",
        );
      }
      const relayer = zamaSDK.relayer as RelayerWeb;
      const result = await runDisperseWithEncryptRetry({
        relayer,
        singletonAddress: singleton,
        userAddress: address,
        recipientCount: recipients.length,
        onPrime: (attempt) => setEncryptAttempt(attempt),
        execute: () =>
          disperse.mutateAsync({
            token,
            mode: "direct",
            recipients: addresses,
            amounts,
            account: address,
          }),
      });
      const campaign: Campaign = {
        id: result.hash,
        creator: address,
        name,
        type: "disperse",
        tokenAddress: token,
        tokenSymbol,
        recipients: recipients.length,
        createdAt: Date.now(),
        status: "confirmed",
        transactionHash: result.hash,
        chainId: sepolia.id,
      };
      saveCampaign(campaign);
      await queryClient.invalidateQueries({ queryKey: campaignQueryKey(address) });
      await queryClient.invalidateQueries({
        queryKey: confidentialBalanceQueryKey(token, address),
      });
    } catch (cause) {
      setError(formatExecutionError(cause));
    } finally {
      setEncryptAttempt(0);
    }
  }

  if (!address) return <ExecutionNotice message="Connect a Sepolia wallet to continue." />;
  if (disperse.data) {
    return (
      <ExecutionSuccess
        hash={disperse.data.hash}
        recipientNote="Recipients receive tokens directly in their confidential balance. They should open My claims and decrypt the balance card — no claim ticket is created for disperse."
        onDone={() => navigate("/app/campaigns")}
      />
    );
  }

  const encrypting = disperse.isPending || encryptAttempt > 0;
  const needsApproval = preflight.data?.hasApprovedSingleton === false;
  return (
    <ExecutionPanel>
      <div className="space-y-5">
        <ConfidentialBalancePanel
          tokenAddress={token}
          tokenSymbol={tokenSymbol}
          decimals={decimals}
          requiredAmount={total > 0n ? total : undefined}
          title="Wallet balances for this send"
        />
        {token.toLowerCase() === defaultToken.toLowerCase() && (
          <TestTokenFaucet
            recipient={address}
            campaignTotal={total}
            tokenSymbol={tokenSymbol}
            decimals={decimals}
          />
        )}
      </div>
      <StatusRow complete={Boolean(preflight.data?.amountsOk)} label="Recipient amounts validated" />
      <StatusRow complete={Boolean(preflight.data?.batchOk)} label="Within TokenOps batch limit" />
      <StatusRow complete={!needsApproval} label="TokenOps operator authorization" />
      {preflight.isLoading && <p className="mt-4 text-xs text-slate-500">Running TokenOps preflight checks…</p>}
      {preflight.error && <ErrorNotice message={preflight.error.message} />}
      {error && <ErrorNotice message={error} />}
      {fhe.initError && (
        <ErrorNotice message={formatExecutionError(fhe.initError)} />
      )}
      {needsApproval ? (
        <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => void approve()} disabled={approving}>
          {approving ? <><LoaderCircle className="animate-spin" size={16} /> Confirming approval…</> : <><ShieldCheck size={16} /> Approve TokenOps for one hour</>}
        </Button>
      ) : (
        <Button
          className="mt-6 h-12 w-full rounded-2xl"
          onClick={() => void execute()}
          disabled={
            !preflight.data?.ready ||
            encrypting ||
            !wallet.data ||
            !fhe.ready
          }
        >
          {encrypting ? (
            <><LoaderCircle className="animate-spin" size={16} /> Encrypting {recipients.length} amounts{encryptAttempt > 1 ? ` (retry ${encryptAttempt})` : ""} — keep tab open…</>
          ) : !fhe.ready ? (
            <><LoaderCircle className="animate-spin" size={16} /> Loading privacy engine…</>
          ) : (
            <><ShieldCheck size={16} /> Encrypt & execute distribution</>
          )}
        </Button>
      )}
      {preflight.data?.blockers.map((blocker) => (
        <p key={blocker} className="mt-2 text-xs text-amber-200/60">{blocker}</p>
      ))}
    </ExecutionPanel>
  );
}

function AirdropExecution({
  name,
  token,
  tokenSymbol,
  decimals,
  recipients,
  startTimestamp,
  endTimestamp,
  fhe,
}: {
  name: string;
  token: Address;
  tokenSymbol: string;
  decimals: number;
  recipients: PreparedRecipient[];
  startTimestamp: number;
  endTimestamp: number;
  fhe: ReturnType<typeof usePrivloFheWarmup>;
}) {
  const { address } = useAccount();
  const zamaSDK = useZamaSDK();
  const factory = requireFheAirdropFactoryAddress(sepolia.id);
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const wallet = useWalletClient({ chainId: sepolia.id });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [approving, setApproving] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string>();
  const [deliveryWarning, setDeliveryWarning] = useState<string>();
  const [recipientClaimLinks, setRecipientClaimLinks] = useState<
    Array<{ recipient: Address; url: string }>
  >([]);
  const [resultHash, setResultHash] = useState<`0x${string}`>();
  const total = recipients.reduce((sum, recipient) => sum + recipient.amount, 0n);

  const operator = useReadContract({
    address: token,
    abi: erc7984OperatorAbi,
    functionName: "isOperator",
    args: address ? [address, factory] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(address) },
  });
  const createAirdrop = useCreateAndFundConfidentialAirdropAndGetAddress({
    encryptor: () => zamaSDK.relayer,
  });

  async function approve() {
    if (!publicClient || !wallet.data || !address) return;
    setApproving(true);
    setError(undefined);
    try {
      await setOperator({
        publicClient,
        walletClient: wallet.data,
        account: address,
        token,
        spender: factory,
        deadline: BigInt(endTimestamp + 60 * 60),
      });
      await operator.refetch();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Operator approval failed.");
    } finally {
      setApproving(false);
    }
  }

  async function execute() {
    if (!address || !wallet.data) return;
    setError(undefined);
    setDeliveryWarning(undefined);
    setIssuing(true);
    let confirmed:
      | {
          hash: `0x${string}`;
          airdrop: Address;
        }
      | undefined;
    try {
      await fhe.ensureReady();
      const now = Math.floor(Date.now() / 1000);
      if (startTimestamp <= now || endTimestamp <= now) {
        throw new Error(
          "The claim window is no longer valid. Return to Details and choose new dates.",
        );
      }
      const [activeAccount] = await wallet.data.getAddresses();
      if (!activeAccount || activeAccount.toLowerCase() !== address.toLowerCase()) {
        throw new Error(
          "The active wallet changed. Reconnect the original creator before continuing.",
        );
      }
      setProgress("Deploying and funding confidential airdrop…");
      const result = await createAirdrop.mutateAsync({
        params: {
          token,
          startTimestamp,
          endTimestamp,
          canExtendClaimWindow: false,
          admin: address,
        },
        userSalt: keccak256(toBytes(`${address}:${Date.now()}:${crypto.randomUUID()}`)),
        amount: total,
        account: address,
      });
      confirmed = result;

      const createdAt = Date.now();
      saveCampaign({
        id: result.hash,
        creator: address,
        name,
        type: "airdrop",
        tokenAddress: token,
        tokenSymbol,
        recipients: recipients.length,
        createdAt,
        status: "confirmed",
        transactionHash: result.hash,
        chainId: sepolia.id,
      });
      await queryClient.invalidateQueries({
        queryKey: campaignQueryKey(address),
      });

      const claims: Array<{
        recipient: Address;
        claim: import("../types/campaign").ConfidentialClaim;
      }> = [];

      for (let index = 0; index < recipients.length; index += 1) {
        const recipient = recipients[index];
        const [signingAccount] = await wallet.data.getAddresses();
        if (
          !signingAccount ||
          signingAccount.toLowerCase() !== address.toLowerCase()
        ) {
          throw new Error(
            "The creator wallet changed while authorizations were being issued.",
          );
        }
        setProgress(`Encrypting authorization ${index + 1} of ${recipients.length}…`);
        const encryptedInput = await runEncryptWithRetry(() =>
          encryptUint64({
            encryptor: zamaSDK.relayer,
            contractAddress: result.airdrop,
            userAddress: recipient.address,
            value: recipient.amount,
          }),
        );
        setProgress(`Signing authorization ${index + 1} of ${recipients.length}…`);
        const signature = await signClaimAuthorization({
          walletClient: wallet.data,
          airdropAddress: result.airdrop,
          recipient: recipient.address,
          encryptedAmountHandle: encryptedInput.handle,
        });
        const issuedClaim = {
          recipient: recipient.address,
          claim: {
            id: `${result.airdrop}:${encryptedInput.handle}`,
            campaignName: name,
            tokenAddress: token,
            tokenSymbol,
            airdropAddress: result.airdrop,
            encryptedInput,
            signature,
            createdAt,
          },
        };
        claims.push(issuedClaim);
        saveLocalClaims([issuedClaim]);
      }

      setRecipientClaimLinks(
        claims.map(({ recipient, claim }) => ({
          recipient,
          url: buildClaimImportUrl(recipient, claim),
        })),
      );

      setProgress("Delivering encrypted claim authorizations…");
      try {
        if (!wallet.data) {
          throw new Error("Creator wallet is unavailable for claim delivery.");
        }
        await publishClaims({
          creator: address,
          campaignName: name,
          signMessage: (message) =>
            wallet.data!.signMessage({ account: address, message }),
          claims,
        });
      } catch (cause) {
        setDeliveryWarning(
          cause instanceof Error
            ? `The airdrop is funded and local claims are safe, but remote delivery failed: ${cause.message}`
            : "The airdrop is funded and local claims are safe, but remote delivery failed.",
        );
      }
      await queryClient.invalidateQueries({
        queryKey: confidentialBalanceQueryKey(token, address),
      });
      setResultHash(result.hash);
    } catch (cause) {
      if (confirmed) {
        await queryClient.invalidateQueries({
          queryKey: confidentialBalanceQueryKey(token, address),
        });
        setResultHash(confirmed.hash);
        setDeliveryWarning(
          "The airdrop was funded onchain, but authorization generation was interrupted. Do not fund it again; recover or withdraw the remaining pool from the TokenOps airdrop contract.",
        );
      } else {
        if (
          cause instanceof Error &&
          /timed out|timeout/i.test(cause.message)
        ) {
          void fhe.retryWarmup();
        }
        setError(formatExecutionError(cause));
      }
    } finally {
      setIssuing(false);
      setProgress("");
    }
  }

  if (!address) return <ExecutionNotice message="Connect a Sepolia wallet to continue." />;
  if (resultHash) {
    return (
      <ExecutionSuccess
        hash={resultHash}
        warning={deliveryWarning}
        claimLinks={recipientClaimLinks}
        onDone={() => navigate("/app/campaigns")}
      />
    );
  }

  return (
    <ExecutionPanel>
      <div className="space-y-5">
        <ConfidentialBalancePanel
          tokenAddress={token}
          tokenSymbol={tokenSymbol}
          decimals={decimals}
          requiredAmount={total > 0n ? total : undefined}
          title="Wallet balances for this send"
        />
        {token.toLowerCase() === defaultToken.toLowerCase() && (
          <TestTokenFaucet
            recipient={address}
            campaignTotal={total}
            tokenSymbol={tokenSymbol}
            decimals={decimals}
          />
        )}
      </div>
      <StatusRow complete={true} label="Recipient allocations validated" />
      <StatusRow complete={Boolean(operator.data)} label="Airdrop factory authorization" />
      <StatusRow
        complete={true}
        label="Recipient claim links generated after execution"
      />
      {error && <ErrorNotice message={error} />}
      {progress && <p className="mt-4 text-xs text-mint">{progress}</p>}
      {fhe.initError && <ErrorNotice message={formatExecutionError(fhe.initError)} />}
      {!operator.data ? (
        <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => void approve()} disabled={approving || operator.isLoading}>
          {approving ? <><LoaderCircle className="animate-spin" size={16} /> Confirming approval…</> : <><ShieldCheck size={16} /> Approve airdrop factory</>}
        </Button>
      ) : (
        <Button
          className="mt-6 h-12 w-full rounded-2xl"
          onClick={() => void execute()}
          disabled={issuing || !fhe.ready || Boolean(fhe.initError)}
        >
          {issuing ? <><LoaderCircle className="animate-spin" size={16} /> Processing authorizations…</> : !fhe.ready ? <><LoaderCircle className="animate-spin" size={16} /> Loading privacy engine…</> : <><Gift size={16} /> Fund & issue private claims</>}
        </Button>
      )}
      <p className="mt-3 text-center text-[11px] leading-5 text-slate-600">
        Your wallet signs one recipient-bound authorization per allocation.
      </p>
    </ExecutionPanel>
  );
}



function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-400">{label}</span>{children}</label>;
}
function FieldHint({ children, positive, error }: { children: React.ReactNode; positive?: boolean; error?: boolean }) {
  return <span className={cn("mt-2 block text-xs text-slate-600", positive && "text-mint/70", error && "text-rose-300")}>{children}</span>;
}
function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-600">{label}</p><p className="mt-2 truncate text-sm font-semibold">{value}</p></div>;
}
function ExecutionPanel({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 rounded-3xl border border-white/[.08] bg-panel/75 p-6 sm:p-8">{children}</div>;
}
function StatusRow({ complete, label }: { complete: boolean; label: string }) {
  return <div className="flex items-center gap-3 border-b border-white/[.055] py-3 first:pt-0"><span className={cn("grid size-5 place-items-center rounded-full", complete ? "bg-mint/15 text-mint" : "bg-white/[.05] text-slate-600")}>{complete ? <Check size={12} /> : <span className="size-1.5 rounded-full bg-current" />}</span><span className="text-sm text-slate-400">{label}</span></div>;
}
function ErrorNotice({ message }: { message: string }) {
  return <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-rose-400/15 bg-rose-400/[.04] p-3 text-xs leading-5 text-rose-200"><AlertCircle size={15} className="mt-0.5 shrink-0" />{message}</div>;
}
function ExecutionNotice({ message }: { message: string }) {
  return <ExecutionPanel><div className="flex items-center gap-3 text-sm text-slate-400"><AlertCircle size={17} />{message}</div></ExecutionPanel>;
}
function ExecutionSuccess({
  hash,
  warning,
  recipientNote,
  claimLinks = [],
  onDone,
}: {
  hash: `0x${string}`;
  warning?: string;
  recipientNote?: string;
  claimLinks?: Array<{ recipient: Address; url: string }>;
  onDone: () => void;
}) {
  const [copiedRecipient, setCopiedRecipient] = useState<string>();

  async function copyClaimLink(recipient: Address, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedRecipient(recipient.toLowerCase());
      window.setTimeout(() => setCopiedRecipient(undefined), 2000);
    } catch {
      window.prompt("Copy this claim link for the recipient:", url);
    }
  }

  return (
    <ExecutionPanel>
      <div className="py-4 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-mint text-[#06241c]"><CheckCircle2 size={23} /></span>
        <h2 className="mt-5 font-display text-2xl font-semibold">Campaign confirmed</h2>
        <p className="mt-2 text-sm text-slate-500">The TokenOps transaction was mined on Sepolia.</p>
        {recipientNote && (
          <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-mint/15 bg-mint/[.04] p-4 text-left text-xs leading-5 text-slate-400">
            {recipientNote}
          </div>
        )}
        {claimLinks.length > 0 && (
          <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-mint/15 bg-mint/[.04] p-4 text-left">
            <p className="text-sm font-semibold text-slate-200">
              Send claim links to recipients
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Recipients open their link with the matching wallet to load the
              encrypted authorization, then decrypt and claim on My claims.
            </p>
            <ul className="mt-4 space-y-3">
              {claimLinks.map(({ recipient, url }) => (
                <li
                  key={recipient}
                  className="rounded-xl border border-white/[.07] bg-black/20 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-slate-300">
                      {shortAddress(recipient)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyClaimLink(recipient, url)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-mint"
                    >
                      <Copy size={13} />
                      {copiedRecipient === recipient.toLowerCase()
                        ? "Copied"
                        : "Copy link"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {warning && (
          <div className="mx-auto mt-4 max-w-xl rounded-xl border border-amber-400/20 bg-amber-400/[.05] p-3 text-left text-xs leading-5 text-amber-100/80">
            {warning}
          </div>
        )}
        <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer" className="mt-4 block truncate font-mono text-xs text-mint">{hash}</a>
        <Button className="mt-6" onClick={onDone}>Return to dashboard</Button>
      </div>
    </ExecutionPanel>
  );
}


