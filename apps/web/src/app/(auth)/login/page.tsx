import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    // The (auth) layout provides the split-panel shell + centering.
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
