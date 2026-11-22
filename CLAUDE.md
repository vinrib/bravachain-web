@AGENTS.md

## PTAX — Cotações de Referência (`apps/web/src/components/ptax/`, `apps/web/src/lib/ptax/`)

- **Fonte única da API:** todos os números exibidos vêm das strings decimais de `/v1/ptax/*` (via BFF `/api/backend/v1/ptax/*`). O front **não faz cálculo financeiro** — arredonda e formata strings diretamente em pt-BR (4 casas para cotações/valores, 2 casas para percentuais). Float é usado apenas para escala de eixo e posição em pixels.
- **Fuso horário:** todo formatador de data/hora usa `timeZone: "America/Sao_Paulo"` explícito (nunca o fuso do navegador).
- **Copy centralizada:** todas as strings de interface vivem em `apps/web/src/lib/ptax/copy.ts` e são varridas por `copy.test.ts` contra a política de texto regulatório (`bravachain-api/src/common/client-text-policy.ts`). Fonte exibida: `"Fonte: Banco Central do Brasil — PTAX"`, sem CTA para operações.
- **Feature flags (todas `false` por padrão em `apps/web/src/lib/feature-flags.ts`):**
  - `NEXT_PUBLIC_FEATURE_COTACOES` — libera a rota `/cotacoes` (`notFound()` quando off).
  - `NEXT_PUBLIC_FEATURE_COTACOES_CHART` — libera o gráfico histórico (`1D/1W/1M/3M/1Y`).
  - `NEXT_PUBLIC_FEATURE_COTACOES_CALCULADORA` — libera a Calculadora de referência (também se oculta automaticamente se a API responder `404 { code: "feature_disabled" }`).
  - `NEXT_PUBLIC_FEATURE_COTACOES_ALERTAS` — exibe o componente legado de alertas.
- **Código legado (`src/components/rates/**`, `src/lib/rates/**`):** não alterar nesta etapa (será removido na Etapa 5).
