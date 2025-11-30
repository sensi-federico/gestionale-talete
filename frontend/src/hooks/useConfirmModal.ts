import { useCallback, useState } from "react";

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: "danger" | "warning" | "info";
  confirmText: string;
  cancelText: string;
  resolve: ((value: boolean) => void) | null;
}

const initialState: ConfirmState = {
  isOpen: false,
  title: "",
  message: "",
  variant: "danger",
  confirmText: "Conferma",
  cancelText: "Annulla",
  resolve: null
};

interface ConfirmOptions {
  title: string;
  message: string;
  variant?: "danger" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
}

export const useConfirmModal = () => {
  const [state, setState] = useState<ConfirmState>(initialState);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        variant: options.variant ?? "danger",
        confirmText: options.confirmText ?? "Conferma",
        cancelText: options.cancelText ?? "Annulla",
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(initialState);
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(initialState);
  }, [state.resolve]);

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    variant: state.variant,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    confirm,
    handleConfirm,
    handleCancel
  };
};
