import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { AppShell } from "./components/layout/app-shell";
import { WalletActivationProvider } from "./providers/wallet-activation-context";

const Web3Provider = lazy(() =>
  import("./providers/web3-provider").then((module) => ({
    default: module.Web3Provider,
  })),
);

function AppRouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink text-sm text-slate-500">
      Loading Privlo…
    </div>
  );
}

/**
 * Wagmi + Zama must mount on every /app route. A gated wallet layer caused
 * useAccount() to throw on hard refresh (Recovery mode) because isActive
 * reset to false while app pages still rendered.
 */
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
        <Suspense fallback={<AppRouteFallback />}>
          <Web3Provider>
            <AppShell />
          </Web3Provider>
        </Suspense>
      </QueryClientProvider>
    </WalletActivationProvider>
  );
}