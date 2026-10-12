# Proposta — Seção 4: Extrato / Recibos / Dashboard

> **Documento de proposta (somente leitura).** Nenhuma tela foi implementada.
> Seção 4 da ordem do [gap map](./DESIGN_GAP_MAP.md). São **3 sub-áreas** →
> proponho **1 PR por sub-área**. Pontos que dependem de você: ⚠️.

**Alerta geral:** no `openapi.json` **nenhuma** dessas respostas é tipada — então os campos exatos precisam ser confirmados (DTOs/exemplos do backend) antes de codar cada sub-área.

---

## A. Extrato (refino do que já existe)
**Hoje:** `/extrato` usa `GET /v1/wallet/history` (normalizado defensivamente em `lib/models.ts`) e exporta **PDF no cliente** (jsPDF).

**Backend mais rico (não usado):**
- `GET /v1/statement` — params `startDate, endDate, type, page, limit` (filtros + paginação).
- `GET /v1/statement/export` — params `... , format` (export **no servidor**).
- `GET /v1/statement/{type}/{id}` — detalhe de um lançamento.

**Proposta:**
- Adicionar **filtros** (período, tipo) e **paginação** via `/v1/statement`.
- Trocar o export client-side por `/v1/statement/export` (via BFF; confirmar formatos aceitos em `format` — CSV? PDF?).
- Detalhe de lançamento via `/v1/statement/{type}/{id}`.

**Risco/flag:** a tela já está no ar. Migrar a fonte (`wallet/history` → `statement`) muda o normalizer. Posso fazer **atrás de uma flag** (`NEXT_PUBLIC_FEATURE_EXTRATO_V2`) para risco zero, ou direto. ⚠️ Você prefere flag ou direto?

⚠️ **Preciso:** shapes de `/v1/statement` e `/v1/statement/export` (+ formatos do `format`).

## B. Recibos (de saque PIX)
**Novo.** Endpoints: `GET /v1/receipts` (lista, `page/limit`), `GET /v1/receipts/{withdrawalId}`, `GET /v1/receipts/{withdrawalId}/pdf`, `POST /v1/receipts/{withdrawalId}/send-email`.

**Proposta:**
- No `/saque`, após sucesso, link **"Ver recibo"**.
- Lista de recibos — ⚠️ **onde mora?** (aba dentro de `/extrato`, ou página própria `/recibos`?).
- **Baixar PDF** (via BFF proxy, como fiz no `/pay`), **Enviar por e-mail** (`POST send-email`).
- **Flag** `NEXT_PUBLIC_FEATURE_RECIBOS` (default off) até confirmar.

⚠️ **Preciso:** shapes de `/v1/receipts` e `/v1/receipts/{id}`; o `send-email` leva corpo (e-mail de destino?) ou só o `withdrawalId`?

## C. Dashboard financeiro (tela Início)
**O canvas NÃO tem design do dashboard** (só thumbnail). **Hoje** `/` mostra saldo + 5 últimas movimentações + banner KYC.

**Backend (não usado):** `GET /v1/dashboard/financial` e `/summary`, `/tpv`, `/rates`, `/rails`, `/importers` (param `period`).

**Proposta:** enriquecer o Início com KPIs (ex.: TPV do período, resumo, taxas, rails), **mas isso precisa de decisão de produto/design** — quais métricas, qual layout, período padrão. Sem design, proponho um conjunto mínimo e peço aprovação **antes** de codar.

- **Flag** `NEXT_PUBLIC_FEATURE_DASHBOARD_FIN` (default off) até definir.

⚠️ **Preciso:** shapes das respostas **e** decisão de produto (quais métricas/period/layout) — não há design para seguir.

---

## Ordem sugerida (1 PR por sub-área)
1. **Extrato (refino)** — maior valor imediato, backend pronto.
2. **Recibos** — complementa o saque; backend pronto.
3. **Dashboard financeiro** — por último (depende de design/decisão).

## Pendências para destravar
1. ⚠️ **Shapes** (todas as respostas são untyped): me passe DTOs/exemplos de `statement`, `statement/export`, `receipts`, `receipts/{id}`, `dashboard/financial/*`.
2. ⚠️ **Extrato:** migrar fonte com **flag** ou direto?
3. ⚠️ **Recibos:** onde mora (aba no extrato vs `/recibos`) e corpo do `send-email`.
4. ⚠️ **Dashboard:** quais métricas/layout/period (sem design).
5. Por qual sub-área começar (sugiro Extrato).

> Com (1)–(5), começo pela sub-área escolhida, num PR próprio, confirmando o design de cada uma antes de codar quando não houver referência.
