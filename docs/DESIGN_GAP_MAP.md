# Design ↔ Repo — Mapa de Lacunas (Gap Map)

> **Documento somente leitura.** Nenhum código de tela foi alterado para produzi-lo.
> Objetivo: cruzar o design do Claude Design com o que já existe no repo e no
> backend, para priorizar a construção **uma seção por PR**.

Gerado em 2026-10-11, a partir de:
- Design: projeto Claude Design `Bravachain` (`Bravachain.dc.html` / `Bravachain-standalone-src.dc.html`).
- Repo: `apps/web` (rotas e componentes atuais).
- Backend: `packages/api-client/openapi.json` (spec gerado) + `packages/api-client/src/endpoints.ts`.

---

## 1. Como ler este documento

**Cobertura no design**
- ✅ **Desenhada** — há tela(s) detalhada(s) e anotada(s) no canvas do design.
- 🔸 **Só menu** — a seção aparece apenas como item do menu lateral do design, **sem** tela dedicada legível no canvas.

**Backend**
- Preferimos a superfície `/v1/*` ("public-api"), que é a que o front já usa. Endpoints sem `/v1` (ex.: `/circle/*`, `/transactions`, `/ledger/*`) parecem internos/legados — marcados como *(a confirmar)*.
- **sem backend** = nenhuma rota encontrada para alimentar a seção.

**Esforço:** **P** (pequeno, refino), **M** (médio, tela nova com backend pronto), **G** (grande, múltiplas telas / backend a amarrar).

---

## 2. ⚠️ Observação importante sobre o escopo do design

O **canvas** do Claude Design contém **apenas 2 seções desenhadas**:

1. **Fluxo de acesso** (variações `17a`–`17m`) — login, esqueci a senha, redefinir, confirmação. **✅ já implementado e em produção.**
2. **Dados de conta** (variações `16a`/`16b`/`16c`) — uma tela por moeda (USD, EUR, BRL): dados bancários, tarifas, tempo, limites e disponibilidade.

Todas as **outras** seções da lista (Depósito, Pagamentos recebidos, Invoices, Cotações, Instruções de recebimento, Empresa e usuários, Central de ajuda, Configurações) aparecem **somente como itens do menu lateral** dentro da tela "Dados de conta" — **não** há tela dedicada desenhada para elas no canvas legível. O protótipo clicável completo existe como `Bravachain.html`, mas é um bundle **minificado** (não serve como spec confiável).

**Consequência prática:** para as seções "🔸 só menu", o design define _que elas existem no produto_, mas não _como são_. A construção dessas vai exigir uma rodada de design por seção (ou decisão de produto), e não só "copiar do design".

---

## 3. Visão geral (tabela)

| # | Seção | Design | Repo hoje | Backend (preferência `/v1`) | Esforço | Dependências |
|---|-------|--------|-----------|------------------------------|---------|--------------|
| — | **Acesso** (login / esqueci / redefinir) | ✅ Desenhada | ✅ **Feito** (em prod) | `/v1/auth/login\|signup\|refresh\|logout\|forgot-password\|reset-password` | — | — |
| 1 | **Dados de conta** (USD/EUR/BRL) | ✅ Desenhada | ❌ Não existe | BRL: `/v1/receive/pix-key`; instruções: `/v1/receive/{ticketId}/instructions`; **USD/EUR bancário: a confirmar** (`/circle/accounts`?) | M | Confirmar endpoint de dados bancários USD/EUR |
| 2 | **Início** (dashboard) | 🔸 Só menu | ⚠️ Existe (`/`) — usa saldo + transações; sem sessão mostra "Missing Bearer token" | `/v1/dashboard/financial/{summary,tpv,rates,rails,importers}`, `/v1/wallet` | M | Sessão válida; design do dashboard |
| 3 | **Extrato** | 🔸 Só menu | ⚠️ Existe (`/extrato`) — usa `/v1/wallet/history` | `/v1/statement`, `/v1/statement/export`, `/v1/wallet/history` | P–M | — |
| 4 | **Saques via PIX** | 🔸 Só menu | ⚠️ Existe (`/saque`) — usa `POST /v1/withdraw/pix` | `/v1/withdraw/pix` (POST/GET), `/v1/withdraw/pix/{id}`, `/v1/receipts*` | P–M | KYB aprovado |
| 5 | **Verificação (KYB)** | 🔸 Só menu | ✅ Existe (`/cadastro`, `/cadastro/retorno`) — `/kyc/submit`, `/kyc/status` | `/kyc/*`, `/v1/onboarding/*` | P (revisar) | Avenia |
| 6 | **Instruções de recebimento** | 🔸 Só menu | ❌ | `/v1/receive/{ticketId}/instructions`, `/v1/receive/pix-key`, `/v1/receive/request-payment` | M | Depende de #1 |
| 7 | **Cotações** | 🔸 Só menu | ❌ | `/v1/rates`, `/v1/rates/live`, `/v1/rates/convert`, `/v1/rates/history`, `/v1/rates/alerts` | M | — |
| 8 | **Pagamentos recebidos** | 🔸 Só menu | ❌ | `/v1/charges*`, `/v1/receive/*`, `/transactions` *(a confirmar)* | M | — |
| 9 | **Configurações** | 🔸 Só menu | ❌ | Parcial: `/v1/profile/branding`, `/v1/receive/pix-key`, `/v1/accountant-report/accountant`, `/v1/rates/alerts` | M | — |
| 10 | **Empresa e usuários** | 🔸 Só menu | ❌ | `/v1/onboarding/company`, `/v1/onboarding/status`, `/users`, `/accounts/*` *(a confirmar)*, `/v1/profile/branding` | G | — |
| 11 | **Invoices** | 🔸 Só menu | ❌ | `/v1/charges*`, `/v1/importers`, `/v1/importers/{id}/charges` | G | Importers / Empresa |
| 12 | **Depósito** | 🔸 Só menu | ❌ | `/circle/deposit` *(a confirmar)*, `/v1/receive/*` | M | Depende de #1 |
| 13 | **Central de ajuda** | 🔸 Só menu | ❌ | **sem backend** (conteúdo estático/suporte) | P | — |

Menu atual do repo (`components/layout/nav-items.ts`): **Início, Extrato, Saque PIX, Verificação** (4 itens). O design prevê ~11. Ver regra de produto na seção 6.

---

## 4. Detalhe por seção

### Acesso — ✅ feito
Login (com "Lembrar de mim" + mostrar/ocultar senha + 429), Esqueci a senha (sucesso genérico + cooldown 30s + 429), Redefinir senha (token em memória, strip da URL, validação ao vivo, estados sucesso/inválido/429). Em produção.

### 1. Dados de conta (USD / EUR / BRL) — ✅ única outra tela desenhada
Conteúdo do design (turn 16):
- **Cabeçalho:** "Dados de conta", saldo disponível por moeda, botão **"Copiar dados"** (toast ao copiar).
- **USD (16a):** Titular, Número da conta (checking), Routing/ABA, nome e endereço do banco; "Receba USD dos EUA por Wire ou ACH".
  - Tarifas: Wire doméstico e ACH **sem tarifa Bravachain**.
  - Tempo: Wire mesmo dia útil (se até 17h ET); ACH 1–3 dias úteis.
  - Limites: sem valor mínimo por pagamento; mensal conforme limite da empresa.
  - Disponibilidade: Wire doméstico (Fedwire), ACH; **SWIFT internacional — "em breve"**.
- **EUR (16b):** mesma estrutura, baseada em **IBAN**.
- **BRL (16c):** baseada em **PIX** (chave PIX de recebimento).

Backend: BRL via `/v1/receive/pix-key`; instruções via `/v1/receive/{ticketId}/instructions`. **Os dados bancários de USD/EUR (Wire/ACH/IBAN) não têm endpoint `/v1` óbvio** — candidato é `/circle/accounts` (superfície não-`/v1`). **Precisa de confirmação no backend** (ver seção 7).

### 2. Início (dashboard)
Repo já tem `/` com saldo (`/v1/wallet`) e transações recentes. O backend tem um **dashboard financeiro** rico (`/v1/dashboard/financial/*`: summary, TPV, rates, rails, importers) ainda **não consumido**. O design não detalha o dashboard no canvas (só thumbnail) — exige decisão de design.

### 3. Extrato
Repo `/extrato` usa `/v1/wallet/history`. Backend tem `/v1/statement` + `/v1/statement/export` (export CSV/PDF), mais completos. Refino de baixo esforço com backend pronto.

### 4. Saques via PIX
Repo `/saque` faz `POST /v1/withdraw/pix`. Backend tem **listagem** (`GET /v1/withdraw/pix`, `/v1/withdraw/pix/{id}`) e **recibos** (`/v1/receipts*`, inclusive PDF e envio por e-mail) ainda não usados.

### 5. Verificação (KYB)
Repo `/cadastro` + `/cadastro/retorno` com `/kyc/submit` e `/kyc/status` (fluxo Avenia). Backend também expõe `/v1/onboarding/*`. Revisar alinhamento, sem reescrever.

### 6–13 (🔸 só menu)
Têm **backend** (ver tabela), mas **não têm tela desenhada** no canvas legível. Cada uma precisa de uma rodada de design/produto antes de implementar. Exceção: **Central de ajuda** não tem backend → conteúdo estático ou "Em breve".

---

## 5. Cobertura de backend — resumo
- **Pronto e já usado:** auth, wallet (saldo/histórico), KYC, saque PIX (criação).
- **Pronto e NÃO usado (oportunidade):** dashboard financeiro, statement/export, recibos, cotações (rates/convert/history/alerts), charges/invoices, importers, receive/instructions, profile/branding, notifications, accountant-report.
- **Sem backend:** Central de ajuda.
- **A confirmar (superfície não-`/v1`):** dados bancários USD/EUR (`/circle/accounts`?), depósito (`/circle/deposit`?), usuários/contas (`/users`, `/accounts/*`).

---

## 6. Regra de produto (confirmada)
**Não inventar conteúdo.** Uma seção **sem backend** (ou com backend não confirmado) **não entra no menu** ou entra marcada **"Em breve"** — **nunca** com dados fictícios. Aplicar isso ao crescer o menu de 4 → 11 itens: só promover um item quando a tela tiver dados reais.

---

## 7. Perguntas abertas / onde preciso de você
1. **Dados bancários USD/EUR:** qual endpoint serve Titular/Conta/Routing(ABA)/IBAN e nome do banco? Parece `/circle/accounts`, mas é não-`/v1`. Pode apontar o código do backend (controller/service)?
2. **Menu:** quais itens você quer já visíveis agora vs. "Em breve"?
3. **Dashboard "Início":** usar os `/v1/dashboard/financial/*` já existentes? Há design para ele além do thumbnail?
4. **Prioridade:** confirmar/ajustar a ordem sugerida abaixo.

---

## 8. Ordem de implementação sugerida (uma seção por PR)

Equilíbrio entre "já está desenhado", "backend pronto" e "valor para a cooperativa (receber/movimentar dinheiro)":

1. **Dados de conta (USD/EUR/BRL)** — única outra tela desenhada; alto valor (receber). _Bloqueado por_ confirmar endpoint USD/EUR (#7.1).
2. **Instruções de recebimento** — reaproveita #1; backend pronto.
3. **Extrato** (refino) — baixo esforço, backend pronto (`/v1/statement` + export).
4. **Saques via PIX** (refino) — adicionar listagem + recibos.
5. **Cotações** — backend pronto e rico.
6. **Pagamentos recebidos** — backend pronto.
7. **Início / dashboard financeiro** — consumir `/v1/dashboard/financial/*` (precisa de design).
8. **Configurações** — chave PIX, branding, e-mail do contador, alertas.
9. **Empresa e usuários** — maior; onboarding/company + usuários.
10. **Invoices** — maior; charges + importers.
11. **Depósito** — depende de #1.
12. **Central de ajuda** — estático / "Em breve" (sem backend).
- **Verificação (KYB):** revisar o existente conforme necessário (não é seção nova).

> Cada item vira um PR próprio, com design confirmado antes de codar quando a seção for "🔸 só menu".
