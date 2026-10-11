"use client";

interface PasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
}

/**
 * Show/hide button rendered inside a password `Input` as its `suffix`. Uses
 * `type="button"` so it never submits the form, and labels itself for screen
 * readers without ever exposing the password value.
 */
export function PasswordToggle({ visible, onToggle }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={visible}
      aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      className="flex items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
    >
      {visible ? (
        // eye-off
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2 3.3M6.1 6.1C3.9 7.5 2.5 9.6 2 12c1 3 5 7 10 7 1.5 0 2.9-.3 4.1-.9"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // eye
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2 12c1-3 5-7 10-7s9 4 10 7c-1 3-5 7-10 7s-9-4-10-7z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )}
    </button>
  );
}
