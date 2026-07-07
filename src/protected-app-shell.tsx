import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useState, type PropsWithChildren } from "react";
import { AppShell } from "./components/layout/app-shell";
import {
  WalletActivationProvider,
  useWalletActivation,
} from "./providers/wallet-activation-context";

const Web3Provider = lazy(() =>
  import("./providers/web3-provider").then((module) => ({
    default: module.Web3Provider,
  })),
);

function WalletLayer({ children }: PropsWithChildren) {
  const { isActive } = useWalletActivation();

  if (!isActive) return children;

  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-ink text-sm text-slate-500">
          Preparing wallet connection…
        </div>
      }
    >
      <Web3Provider>{children}</Web3Provider>
    </Suspense>
  );
}

export function ProtectedAppShell() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 12_000, retry: 1 },
        },
      }),
  );

  return (
    <WalletActivationProvider>
      <QueryClientProvider client={queryClient}>
        <WalletLayer>
          <AppShell />
        </WalletLayer>
      </QueryClientProvider>
    </WalletActivationProvider>
  );
}