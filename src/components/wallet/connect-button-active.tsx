import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  LoaderCircle,
  LogOut,
  Network,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Connector } from "wagmi";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { useWalletDiscovery } from "../../hooks/use-wallet-discovery";
import { connectDiscoveredWallet, connectWithConnector } from "../../lib/connect-wallet";
import { prepareWalletPicker } from "../../lib/wallet-connectors";
import { useWalletActivation } from "../../providers/wallet-activation-context";
import { useWagmiConfig } from "../../providers/wagmi-config-context";
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

function connectorLabel(connector: Connector) {
  if (connector.id === "walletConnect") return "WalletConnect";
  if (connector.name) return connector.name;
  return "Browser wallet";
}

function connectorDescription(connector: Connector) {
  if (connector.id === "walletConnect") {
    return "Scan a QR code with a mobile wallet";
  }
  return "Connect through your wallet extension";
}

export function ConnectButtonActive() {
  const { consumePickerRequest } = useWalletActivation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [uiError, setUiError] = useState<string>();
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const wagmiConfig = useWagmiConfig();
  const { connectors, reset: resetConnect } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    switchChain,
    error: switchError,
    isPending: isSwitching,
    reset: resetSwitch,
  } = useSwitchChain();
  const { wallets: discoveredWallets, isDiscovering } =
    useWalletDiscovery(pickerOpen);

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const error = uiError ?? walletErrorMessage(switchError);

  const walletConnectors = useMemo(
    () => connectors.filter((candidate) => candidate.id === "walletConnect"),
    [connectors],
  );

  useEffect(() => {
    if (consumePickerRequest()) setPickerOpen(true);
    // Open the picker once when the wallet layer boots after an explicit click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1_600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!pickerOpen) return;
    prepareWalletPicker(wagmiConfig);
  }, [pickerOpen, wagmiConfig]);

  useEffect(() => {
    if (!pickerOpen && !accountMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPickerOpen(false);
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [pickerOpen, accountMenuOpen]);

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

  async function connectWith(selected: Connector) {
    clearError();
    setIsConnecting(true);
    try {
      await connectWithConnector(wagmiConfig, selected);
      setPickerOpen(false);
    } catch (cause) {
      setUiError(
        cause instanceof Error
          ? walletErrorMessage(cause) ?? cause.message
          : "Wallet connection failed.",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  async function connectDiscovered(wallet: (typeof discoveredWallets)[number]) {
    clearError();
    setIsConnecting(true);
    try {
      await connectDiscoveredWallet(wagmiConfig, wallet);
      setPickerOpen(false);
    } catch (cause) {
      setUiError(
        cause instanceof Error
          ? walletErrorMessage(cause) ?? cause.message
          : "Wallet connection failed.",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="relative">
        <Button
          onClick={() => {
            clearError();
            setPickerOpen(true);
          }}
          disabled={isConnecting}
          className="h-10 rounded-full"
        >
          <Wallet size={15} />
          {isConnecting ? "Confirm in wallet…" : "Connect wallet"}
        </Button>

        {pickerOpen && (
          <WalletPicker
            walletConnectors={walletConnectors}
            discoveredWallets={discoveredWallets}
            isDiscovering={isDiscovering}
            isConnecting={isConnecting}
            onClose={() => setPickerOpen(false)}
            onSelectConnector={(selected) => void connectWith(selected)}
            onSelectDiscovered={(selected) => void connectDiscovered(selected)}
          />
        )}
        {error && <WalletError message={error} onClose={clearError} />}
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
        aria-expanded={accountMenuOpen}
        aria-haspopup="menu"
        onClick={() => setAccountMenuOpen((current) => !current)}
        variant="secondary"
        className="h-10 rounded-full pl-2.5 pr-3"
      >
        <span className="grid size-6 place-items-center rounded-full bg-mint/15 text-mint">
          <Check size={13} />
        </span>
        {shortAddress(address)}
        <ChevronDown size={14} className="text-slate-500" />
      </Button>

      {accountMenuOpen && (
        <>
          <button
            aria-label="Close wallet menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setAccountMenuOpen(false)}
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
                  setAccountMenuOpen(false);
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

function WalletPicker({
  walletConnectors,
  discoveredWallets,
  isDiscovering,
  isConnecting,
  onClose,
  onSelectConnector,
  onSelectDiscovered,
}: {
  walletConnectors: Connector[];
  discoveredWallets: ReturnType<typeof useWalletDiscovery>["wallets"];
  isDiscovering: boolean;
  isConnecting: boolean;
  onClose: () => void;
  onSelectConnector: (connector: Connector) => void;
  onSelectDiscovered: (
    wallet: ReturnType<typeof useWalletDiscovery>["wallets"][number],
  ) => void;
}) {
  const hasOptions =
    walletConnectors.length > 0 || discoveredWallets.length > 0;

  return (
    <>
      <button
        aria-label="Close wallet picker"
        className="fixed inset-0 z-40 cursor-default bg-black/55 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="wallet-picker-title"
        className="absolute right-0 top-12 z-50 w-[min(100vw-2rem,22rem)] rounded-2xl border border-white/10 bg-[#101619] p-3 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-1 pb-3">
          <div>
            <p id="wallet-picker-title" className="text-sm font-semibold text-white">
              Connect a wallet
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Choose a wallet. Privlo will not open any wallet until you select one.
            </p>
          </div>
          <button
            aria-label="Close wallet picker"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-white/[.05] hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-2">
          {walletConnectors.map((connector) => (
            <WalletOption
              key={connector.id}
              title={connectorLabel(connector)}
              description={connectorDescription(connector)}
              disabled={isConnecting}
              onClick={() => onSelectConnector(connector)}
            />
          ))}

          {discoveredWallets.map((wallet) => (
            <WalletOption
              key={wallet.id}
              title={wallet.name}
              description="Browser extension wallet"
              icon={wallet.icon}
              disabled={isConnecting}
              onClick={() => onSelectDiscovered(wallet)}
            />
          ))}

          {isDiscovering && (
            <div className="flex items-center gap-2 rounded-xl border border-white/[.06] px-3 py-3 text-xs text-slate-500">
              <LoaderCircle size={14} className="animate-spin text-mint" />
              Discovering installed wallets…
            </div>
          )}

          {!isDiscovering && !hasOptions && (
            <div className="rounded-xl border border-dashed border-white/[.08] px-3 py-4 text-xs leading-5 text-slate-500">
              No wallets were detected. Install MetaMask, Phantom, or another
              EIP-1193 wallet, or use WalletConnect if it is configured.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function WalletOption({
  title,
  description,
  icon,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  icon?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-3 text-left transition hover:border-mint/20 hover:bg-mint/[.04] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[.05] text-slate-300">
        {icon ? (
          <img src={icon} alt="" className="size-6 rounded-md" />
        ) : (
          <Wallet size={18} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </button>
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