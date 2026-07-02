import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  error?: Error;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Privlo render failure", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-ink px-5 text-slate-100">
        <section className="w-full max-w-lg rounded-3xl border border-white/[.08] bg-panel/80 p-8 text-center">
          <p className="eyebrow">Recovery mode</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">
            Privlo could not finish loading
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            No transaction was submitted by this screen. Reload the application
            and reconnect your wallet to continue.
          </p>
          <Button
            className="mt-7"
            onClick={() => window.location.reload()}
          >
            Reload Privlo
          </Button>
        </section>
      </main>
    );
  }
}
