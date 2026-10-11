import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Esqueceu a senha? · Bravachain",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ForgotPasswordForm />
    </main>
  );
}
