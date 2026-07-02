import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Network,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { shortAddress } from "../../lib/utils";
import { Button } from "../ui/button";

function walletErrorMessage(error: Error | null) {
  if (!error) return null;
  const message = error.message.toLowerCase();
  if (message.includes("rejected") || message.includes("denied")) {
    return "The wallet request was rejected.";
  }
  if (message.includes("already pending")) {
    return "A wallet request is already waiting for approval.";
  }
  if (message.includes("connector not connected")) {
    return "Wallet connection was interrupted. Please try again.";
  }
  return error.message.split("\n")[0] || "Wallet request failed.";
}

export function ConnectButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uiError, setUiError] = useState<string>();
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const {
    connectors,
    connect,
    error: connectError,
    isPending: isConnecting,
    reset: resetConnect,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    switchChain,
    error: switchError,
    isPending: isSwitching,
    reset: resetSwitch,
  } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const error = uiError ?? walletErrorMessage(connectError ?? switchError);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1_600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function clearError() {
    setUiError(undefined);
    resetConnect();
    resetSwitch();
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setUiError(
        "Address copying is unavailable. Select and copy the address manually.",
      );
    }
  }

  if (!isConnected) {
    const injectedConnector =
      (typeof window !== "undefined" && window.ethereum
        ? connectors.find((candidate) => candidate.id === "injected")
        : connectors.find((candidate) => candidate.id !== "injected")) ??
      connectors[0];

    return (
      <div className="relative">
        <Button
          onClick={() => {
            clearError();
            if (injectedConnector) connect({ connector: injectedConnector });
          }}
          disabled={isConnecting || !injectedConnector}
          className="h-10 rounded-full"
        >
          <Wallet size={15} />
          {isConnecting ? "Confirm in wallet…" : "Connect wallet"}
        </Button>
        {error && (
          <WalletError message={error} onClose={clearError} />
        )}
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="relative">
        <Button
          onClick={() => {
            clearError();
            switchChain({ chainId: sepolia.id });
          }}
          disabled={isSwitching}
          variant="secondary"
          className="h-10 rounded-full border-amber-400/25 text-amber-200"
        >
          <Network size={15} />
          {isSwitching ? "Switching…" : "Switch to Sepolia"}
        </Button>
        {error && <WalletError message={error} onClose={clearError} />}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        variant="secondary"
        className="h-10 rounded-full pl-2.5 pr-3"
      >
        <span className="grid size-6 place-items-center rounded-full bg-mint/15 text-mint">
          <Check size={13} />
        </span>
        {shortAddress(address)}
        <ChevronDown size={14} className="text-slate-500" />
      </Button>

      {open && (
        <>
          <button
            aria-label="Close wallet menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#101619] p-2 shadow-2xl"
          >
            <div className="p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-mint">
                <CheckCircle2 size={13} />
                Connected to Sepolia
              </div>
              <p className="mt-2 truncate font-mono text-xs text-slate-400">
                {address}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                via {connector?.name ?? "wallet"}
              </p>
            </div>
            <div className="border-t border-white/[.07] pt-2">
              <button
                role="menuitem"
                onClick={() => void copyAddress()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 hover:bg-white/[.05] hover:text-white"
              >
                {copied ? <Check size={15} className="text-mint" /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy address"}
              </button>
              <a
                role="menuitem"
                href={`https://sepolia.etherscan.io/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/[.05] hover:text-white"
              >
                <ExternalLink size={15} />
                View on Etherscan
              </a>
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  disconnect();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-300/80 hover:bg-rose-400/[.06] hover:text-rose-200"
              >
                <LogOut size={15} />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
      {error && <WalletError message={error} onClose={clearError} />}
    </div>
  );
}

function WalletError({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      role="alert"
      className="absolute right-0 top-12 z-50 flex w-72 gap-2 rounded-xl border border-rose-400/20 bg-[#171112] p-3 text-xs text-rose-200 shadow-2xl"
    >
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span className="flex-1 leading-5">{message}</span>
      <button aria-label="Dismiss error" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
