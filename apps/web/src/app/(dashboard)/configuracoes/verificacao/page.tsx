import { VerificationPanel } from "@/components/kyc/verification-panel";
import { OnboardingDocuments } from "@/components/kyc/onboarding-documents";

export default function VerificacaoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Verificação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status da verificação (KYB) e documentos da empresa.
        </p>
      </div>

      <OnboardingDocuments />
      <VerificationPanel />
    </div>
  );
}
