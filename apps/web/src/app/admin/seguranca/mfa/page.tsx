import { requireAdmin } from "@/lib/auth/require-admin";
import { MfaEnrollmentWizard } from "@/components/admin/mfa-enrollment-wizard";

/**
 * MFA activation. Reachable by any admin (including one under enforcement who
 * hasn't enrolled yet) — so this page uses `requireAdmin`, not the enrollment-
 * enforcing gate, to avoid redirecting the very user who came here to enroll.
 */
export default async function MfaEnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  await requireAdmin("/admin/seguranca/mfa");
  const { required } = await searchParams;
  return <MfaEnrollmentWizard required={required === "1"} />;
}
