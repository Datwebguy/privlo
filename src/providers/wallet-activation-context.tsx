import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

interface WalletActivationContextValue {
  isActive: boolean;
  shouldOpenPicker: boolean;
  activate: () => void;
  requestPicker: () => void;
  consumePickerRequest: () => boolean;
}

const WalletActivationContext =
  createContext<WalletActivationContextValue | null>(null);

export function WalletActivationProvider({ children }: PropsWithChildren) {
  const [isActive, setIsActive] = useState(false);
  const [shouldOpenPicker, setShouldOpenPicker] = useState(false);

  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  const requestPicker = useCallback(() => {
    setShouldOpenPicker(true);
  }, []);

  const consumePickerRequest = useCallback(() => {
    if (!shouldOpenPicker) return false;
    setShouldOpenPicker(false);
    return true;
  }, [shouldOpenPicker]);

  const value = useMemo(
    () => ({
      isActive,
      shouldOpenPicker,
      activate,
      requestPicker,
      consumePickerRequest,
    }),
    [
      isActive,
      shouldOpenPicker,
      activate,
      requestPicker,
      consumePickerRequest,
    ],
  );

  return (
    <WalletActivationContext.Provider value={value}>
      {children}
    </WalletActivationContext.Provider>
  );
}

export function useWalletActivation() {
  const context = useContext(WalletActivationContext);
  if (!context) {
    throw new Error("WalletActivationProvider is missing.");
  }
  return context;
}