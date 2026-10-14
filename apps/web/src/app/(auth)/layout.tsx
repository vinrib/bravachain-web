import { Logo } from "@/components/ui/logo";

/**
 * Split-panel auth shell (Claude Design): a deep-green brand panel on the left
 * (desktop) and the form on the right. The brand panel is theme-independent.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-1/2 max-w-[560px] flex-col justify-between bg-[#011a0f] p-10 text-[#f0eee8] lg:flex">
        <div className="flex items-center gap-2">
          <Logo size="md" withWordmark={false} />
          <span className="font-serif text-base font-bold text-[#f0eee8]">
            Bravachain
          </span>
        </div>

        <div className="max-w-md">
          <h2 className="font-serif text-3xl font-bold leading-tight text-[#f0eee8]">
            Pagamentos internacionais, liquidação em reais
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#b7c3bc]">
            Receba de importadores em dólar ou euro e saque em reais via PIX.
          </p>
        </div>

        <p className="text-xs text-[#7f958b]">
          O dinheiro da sua exportação, em reais.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
