import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Redefinir senha · Bravachain",
  // Keep this page out of search indexes — it is reached only via a token link.
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  // The token is read client-side from the URL and immediately stripped; the
  // (auth) layout provides the shell. Response headers (Referrer-Policy,
  // Cache-Control) are set for this path in next.config.ts.
  return <ResetPasswordForm />;
}
