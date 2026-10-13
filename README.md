# Bravachain

Frontend web da **Bravachain** — plataforma B2B de pagamentos cross-border para
empresas exportadoras da Amazônia. Organizado como um monorepo Turborepo,
já preparado para abrigar um futuro app React Native.

## Estrutura

```
apps/
  web/                 # Next.js 16 (App Router, TypeScript, Tailwind v4)
packages/
  shared/              # validações (CPF/CNPJ/PIX), formatação, domínio KYC/KYB
  api-client/          # cliente typed gerado do OpenAPI do backend
```

## Pré-requisitos

- Node.js >= 20
- pnpm 9 (via [corepack](https://nodejs.org/api/corepack.html)): `corepack enable`
  - Neste ambiente Windows o `corepack enable` pode falhar por permissão; então
    use `corepack pnpm@9.15.4 <comando>` diretamente.

## Começando

```bash
pnpm install
pnpm dev            # sobe apps/web em http://localhost:3000
```

Copie `apps/web/.env.example` para `apps/web/.env.local` e ajuste
`BACKEND_API_URL` se necessário (default: API de produção no Railway).

## Autenticação (BFF)

O `apps/web` usa o padrão **Backend for Frontend**: as rotas de API do Next
(`/api/auth/*`) recebem login/signup, guardam o JWT em cookies **httpOnly**
(`bc_at`/`bc_rt`) e o proxy autenticado (`/api/backend/[...path]`) injeta o token
server-side, com refresh + rotação transparentes. Nenhum token é exposto ao
JavaScript do cliente.

## Cliente da API

O `packages/api-client` é gerado a partir do OpenAPI do backend:

```bash
OPENAPI_URL=https://<backend>/openapi.json pnpm generate:api
```

Enquanto não gerado, um schema placeholder mantém o type-check verde. Os pontos
a reconciliar com o schema real estão marcados com `TODO(openapi)`.

## Scripts (raiz)

```bash
pnpm dev            # turbo run dev
pnpm build          # turbo run build
pnpm lint           # turbo run lint
pnpm typecheck      # turbo run typecheck
pnpm generate:api   # gera o api-client a partir do OPENAPI_URL
```
