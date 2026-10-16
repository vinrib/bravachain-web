import { BravaMark } from "@/components/ui/brava-mark";

/**
 * Auth shell matching the Claude Design login artboard (17a): a deep-green
 * brand panel on the left (desktop) with decorative concentric circles and the
 * bottom-anchored headline; a rounded-bottom green header on mobile. The form
 * area sits directly on the sand surface. Brand surfaces are theme-independent.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f2ec] dark:bg-background lg:flex-row">
      {/* Mobile green header (rounded bottom) */}
      <div className="relative overflow-hidden rounded-b-[26px] bg-[#011a0f] px-6 pb-7 pt-5 text-white lg:hidden">
        <div className="pointer-events-none absolute -right-[90px] -top-[70px] h-[240px] w-[240px] rounded-full border border-white/[0.08]" />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white text-black">
            <BravaMark size={20} />
          </span>
          <span className="font-serif text-base font-bold">Bravachain</span>
        </div>
        <h2 className="relative mt-5 font-serif text-[22px] font-bold leading-[1.3]">
          Pagamentos internacionais, liquidação em reais.
        </h2>
      </div>

      {/* Desktop brand panel */}
      <aside className="relative hidden flex-col overflow-hidden bg-[#011a0f] p-10 text-white lg:flex lg:w-[38%] lg:max-w-[480px] lg:px-12">
        <div className="pointer-events-none absolute -right-[180px] -top-[140px] h-[520px] w-[520px] rounded-full border border-white/[0.07]" />
        <div className="pointer-events-none absolute -right-[100px] -top-[60px] h-[360px] w-[360px] rounded-full border border-white/[0.07]" />
        <div className="pointer-events-none absolute -bottom-[200px] -left-[120px] h-[420px] w-[420px] rounded-full bg-[rgba(18,164,107,0.07)]" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white text-black">
            <BravaMark size={22} />
          </span>
          <span className="font-serif text-lg font-bold">Bravachain</span>
        </div>

        <div className="relative mt-auto">
          <h2 className="font-serif text-[32px] font-bold leading-[1.28] tracking-[-0.015em]">
            Pagamentos internacionais, liquidação em reais.
          </h2>
          <p className="mt-4 max-w-[380px] text-[15.5px] leading-[1.6] text-white/[0.78]">
            Receba de importadores em dólar ou euro e saque em reais via PIX.
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-start justify-center p-6 sm:p-10 lg:items-center">
        {children}
      </main>
    </div>
  );
}
