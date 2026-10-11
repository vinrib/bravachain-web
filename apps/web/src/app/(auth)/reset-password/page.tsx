import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Redefinir senha · Bravachain",
  // Keep this page out of search indexes — it is reached only via a token link.
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* The token is read client-side from the URL and immediately stripped;
          nothing token-related is rendered on the server. Response headers
          (Referrer-Policy: no-referrer, Cache-Control: no-store) are set for
          this path in next.config.ts. */}
      <ResetPasswordForm />
    </main>
  );
}
