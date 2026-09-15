"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import * as Toast from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-destructive shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
};

const styles: Record<ToastVariant, string> = {
  success: "border-l-4 border-l-success",
  error: "border-l-4 border-l-destructive",
  info: "border-l-4 border-l-blue-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (title, description) => addToast({ title, description, variant: "success" }),
    error: (title, description) => addToast({ title, description, variant: "error" }),
    info: (title, description) => addToast({ title, description, variant: "info" }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            onOpenChange={(open) => !open && removeToast(t.id)}
            defaultOpen
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[swipe=end]:animate-out data-[state=closed]:fade-out-80",
              "data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-right-full",
              "min-w-[300px] max-w-[420px]",
              styles[t.variant]
            )}
          >
            {icons[t.variant]}
            <div className="flex-1 min-w-0">
              <Toast.Title className="text-sm font-semibold text-foreground">
                {t.title}
              </Toast.Title>
              {t.description && (
                <Toast.Description className="mt-0.5 text-xs text-muted-foreground">
                  {t.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed top-4 right-4 z-50 flex flex-col gap-2 outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
