# Proposta — Instruções de recebimento (Wire-In)

> **Documento de proposta (somente leitura).** Nenhuma tela foi implementada.
> Atualizado com o **contrato real do backend (`main`)**. Pontos ainda em aberto
> estão marcados com ⚠️.

Seção 2 da ordem do [gap map](./DESIGN_GAP_MAP.md). Não há tela no canvas do
design → esta proposta substitui o design para esta seção.

---

## 1. Feature flag (desligada por padrão)
- **`NEXT_PUBLIC_FEATURE_RECEBIMENTOS`** (`"true"`/`"false"`) — **default OFF**.
- OFF → item **some do menu** e as rotas autenticadas de recebimento **redirecionam para `/`**. A rota **pública** `/pay/[shareToken]` **fica sempre ativa** (o importador precisa dela mesmo com a flag off para a empresa).
- Não altera `.env` de produção; só documenta a variável.

## 2. Acesso e rotas
Todas as `/v1/receive/*` exigem **Bearer + KYB aprovado**, exceto `/pay/*` (pública).

| Rota (front) | Acesso | Conteúdo |
|------|--------|----------|
| `/recebimentos` | auth + KYB | chave PIX padrão + criar recebimento + "recentes neste dispositivo" (ver §8) |
| `/recebimentos/[ticketId]` | auth + KYB | instruções formatadas + status + link compartilhável |
| `/pay/[shareToken]` | **pública** | instruções para o importador (PT/EN) + marca do exportador + baixar PDF |

⚠️ **Confirmar:** o backend precisa enviar, nos e-mails ao importador, **exatamente** a URL desta rota pública. Proponho **`/pay/[shareToken]`**. Se o backend usa outro caminho/host, me diga para casar (senão o link do e-mail quebra).

## 3. Criar recebimento — `POST /v1/receive/request-payment`
**Header obrigatório:** `Idempotency-Key` (UUID v4) — ver §7.

**Body:** `{ method, amount (>0), pixKey? }`
- `pixKey` omitido → usa a **chave PIX padrão** do usuário; se não houver nenhuma → **400** (mostro a `message` do backend e levo para cadastrar a chave).
- `method` no contrato: `USD_WIRE | USD_ACH | EUR_SEPA | USDT_TRON | USDT_EVM | USDC_EVM | USDC_TRON`.
- **UI mostra só** `USD_WIRE`, `USD_ACH`, `EUR_SEPA`. Cripto **escondidos** até sua decisão.

Rótulos propostos no seletor:
| value | rótulo |
|-------|--------|
| `USD_WIRE` | Dólar (USD) · Wire |
| `USD_ACH` | Dólar (USD) · ACH |
| `EUR_SEPA` | Euro (EUR) · SEPA |

**Resposta (exibição):** `{ ticketId, method, inputCurrency, depositInstructions, estimatedBrl?, expiresAt?, markupFloatingFee, totalFeePercent, shareToken, shareTokenExpiresAt, feeBreakdown? }`
- Após criar → navego para `/recebimentos/[ticketId]` e busco `GET /instructions` para exibir os **dados formatados** (o `depositInstructions` da resposta é cru → **não exibir**).
- Exibo: `estimatedBrl` (quando vier), `totalFeePercent`, validade (`expiresAt`), e o link (`shareToken` + `shareTokenExpiresAt`).
- **`feeBreakdown`** (só vem com a flag de spread ligada no backend) → renderizo **só se vier**; todos **strings**, BRL com 2 casas; **não calculo nada no front**: `{ grossBrl, percentChargeBrl, fixedChargeBrl, totalChargeBrl, netEstimateBrl, effectiveRate }`.
- ⚠️ `markupFloatingFee` — exibir ou é interno? (default: **não** exibo, salvo você pedir.)
- **Erro "conta dedicada USD/EUR não pronta":** mostro a `message` do backend (sem reconstruir).

## 4. Instruções — `GET /v1/receive/:ticketId/instructions`
Formato bancário (`type: 'BANK_TRANSFER'`): `{ method, methodLabel, ticketId, amount, currency, bankDetails, settlementTime?, instructions: string[], warning: string|null }`
- **USD** `bankDetails`: `{ bankName, routingNumber, accountNumber, swiftCode, beneficiaryName, wireMemo }`
- **EUR** `bankDetails`: `{ bankName, iban, bic, beneficiaryName, wireMemo }`
- Exibo `methodLabel`, `amount`+`currency`, cada campo de `bankDetails` com **Copiar**, a lista `instructions[]`, e `settlementTime` se vier.
- **`wireMemo`**: obrigatório para o pagador → **destaque visual** (bloco próprio, "Inclua esta referência no pagamento").

### Tratamento de "A confirmar" (Avenia pendente)
- Enquanto a Avenia não confirma, campos vêm com o texto **literal `"A confirmar"`** e `warning` vem preenchido.
- Trato `"A confirmar"` como **pendente**: renderizo o campo como pendente (sem botão **Copiar**), mostro o `warning` em banner de aviso, e **bloqueio o "Compartilhar"/"Copiar tudo"/PDF** enquanto houver `warning` (não se envia instrução incompleta ao importador).

## 5. Status — `GET /v1/receive/:ticketId/status`
Resposta: `{ ticketId, method, status, depositInstructions (cru — não exibir), estimatedBrl?, providerStatus? }`.
Mapa de `status` → rótulo pt-BR (desconhecido → mostro o valor cru + badge neutra):
| status | rótulo | tom |
|--------|--------|-----|
| `PENDING_DEPOSIT` | Aguardando depósito | neutro |
| `DEPOSIT_PROCESSING` | Depósito em processamento | info |
| `DEPOSIT_CONFIRMED` | Depósito confirmado | info |
| `DELIVERY_PROCESSING` | Entrega em processamento | info |
| `HOP1_PROCESSING` | Processando (etapa 1) | info |
| `HOP1_COMPLETE` | Etapa 1 concluída | info |
| `COMPLETED` | Concluído | sucesso |
| `FAILED` / `HOP1_FAILED` | Falhou | erro |
| `EXPIRED` | Expirado | erro |
| `CANCELLED` | Cancelado | neutro |
| *(outros)* | *valor cru* | neutro |

Botão "Atualizar" (refetch). Sem polling automático por ora (evita custo); posso adicionar depois.

## 6. Chave PIX padrão (destino do BRL convertido)
- `GET /v1/receive/pix-key` → `{ pixKey: string|null }`
- `PUT { pixKey }` → `{ pixKey, message }`
- `DELETE` → `{ pixKey: null, message }`
- UI: sem chave → CTA "Cadastrar chave PIX" (necessária para criar recebimento); com chave → exibe + Editar/Remover. No form de criar, o campo `pixKey` é opcional (usa a padrão).

## 7. Idempotency-Key
- **UUID v4 por submissão**, enviado no header `Idempotency-Key` do `POST`.
- Fluxo: rota **BFF dedicada** `POST /api/receive/request-payment` recebe o corpo, **garante** um `Idempotency-Key` válido (gera no servidor se ausente) e repassa ao backend. Para ser **seguro a retry de rede**, a key é **estável por submissão** (mesma key enquanto o usuário não inicia uma nova tentativa lógica).
- ⚠️ Confirmar: ok manter a key **estável por submissão** (recomendado) em vez de uma nova por chamada HTTP?

## 8. Sem listagem de recebimentos — workaround (sem inventar dados)
Não existe `GET /v1/receive` (listagem). Proposta:
- Ao criar um recebimento, guardo **só identificadores** no `localStorage` (deste navegador): `{ ticketId, shareToken, method, inputCurrency, createdAt }`. **Nenhum dado financeiro é inventado nem cacheado** — status e instruções são **sempre** re-buscados do backend ao abrir `/recebimentos/[ticketId]`.
- `/recebimentos` mostra "**Recebimentos recentes (neste dispositivo)**" a partir desses ids, deixando claro que **não é a lista oficial** (é por navegador).
- Também permito **colar um `ticketId`** para abrir um recebimento.
- Quando o backend expuser listagem, troco isso pela fonte real.

## 9. Renovar link — bloqueado (dependência de backend)
- `POST /v1/receive/:id/renew-token` usa o **`id` interno (`InboundRemittance.id`)**, **não** o `ticketId`.
- A resposta do `request-payment` **não traz** esse `id` e **não há listagem** → hoje é impossível obtê-lo no front.
- Decisão: implemento a ação contra o contrato `{ id }` (rota BFF + chamada), **oculta atrás de sinalizador** (`NEXT_PUBLIC_FEATURE_RECEBIMENTOS_RENEW`, off), e **registro a dependência**: liberar quando o backend incluir o `id` na resposta do `request-payment` (ou criar listagem). PR de backend em preparação.

## 10. Rota pública do importador (`/pay/[shareToken]`)
- `GET /v1/receive/pay/:shareToken` → instruções + `exporter { displayName, logoUrl, country }` + `createdAt`. **404** (não existe) / **410** (expirou → tela "link expirado").
- `GET /v1/receive/pay/:shareToken/pdf` → `application/pdf` (botão "Baixar PDF").
- Página **pública, sem login**, **PT e EN** (seletor de idioma simples; o projeto já tem i18n).
- `logoUrl` é externo → ⚠️ precisará liberar o host em `next.config` (imagens remotas) **ou** renderizar sem otimização.

---

## 11. Pendências/confirmações antes de implementar
1. ⚠️ **URL do e-mail ao importador** = `/pay/[shareToken]`? (§2/§10)
2. ⚠️ **Idempotency-Key** estável por submissão? (§7)
3. ⚠️ Exibir `markupFloatingFee`? (§3 — default: não)
4. ⚠️ Host do `logoUrl` do exportador (para liberar imagem remota). (§10)

Com esses 4 confirmados, abro o PR de implementação: seção **atrás da flag desligada**, renovar-link oculto atrás do segundo sinalizador, rota pública sempre ativa, e **nada de dado inventado**.
