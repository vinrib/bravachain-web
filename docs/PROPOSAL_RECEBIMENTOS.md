# Proposta — Instruções de recebimento (Wire-In)

> **Documento de proposta (somente leitura).** Nenhuma tela foi implementada.
> Captura o escopo acordado, os padrões assumidos e o que ainda falta confirmar
> **antes** de abrir o PR de implementação.

Seção 2 da ordem do [gap map](./DESIGN_GAP_MAP.md). Não há tela no canvas do
design → esta proposta substitui o design para esta seção.

---

## 1. Feature flag (desligada por padrão)
- **`NEXT_PUBLIC_FEATURE_RECEBIMENTOS`** (`"true"`/`"false"`) — **default OFF**.
- OFF → o item **não aparece no menu** e as rotas de recebimento **redirecionam para `/`**. Clientes reais não conseguem criar recebimentos até você validar o Wire-In em produção e ligar a flag.
- Não altera `.env` de produção; só documenta a variável.

## 2. Rotas (propostas)
| Rota | Acesso | Conteúdo |
|------|--------|----------|
| `/recebimentos` | autenticado | chave PIX padrão + criar recebimento + lista/estado |
| `/recebimentos/[ticketId]` | autenticado | instruções geradas + status + link compartilhável |
| `/pagar/[shareToken]` | **público** | instruções para o pagador no exterior (+ renovar link) |

## 3. Endpoints usados (todos via BFF)
| Ação | Endpoint |
|------|----------|
| Consultar chave PIX padrão | `GET /v1/receive/pix-key` |
| Cadastrar/atualizar chave PIX | `PUT /v1/receive/pix-key` (`SavePixKeyDto`) |
| Remover chave PIX | `DELETE /v1/receive/pix-key` |
| Criar recebimento | `POST /v1/receive/request-payment` (`RequestPaymentDto`) **+ Idempotency-Key** |
| Instruções (empresa) | `GET /v1/receive/{ticketId}/instructions` |
| Status | `GET /v1/receive/{ticketId}/status` |
| Link público do pagador | `GET /v1/receive/pay/{shareToken}` |
| Renovar link expirado | `POST /v1/receive/{id}/renew-token` (+30 dias) |

## 4. Regra de conteúdo
**Mostrar só o que a resposta trouxer. Não inventar taxas, prazos nem valores.**
Como o `openapi.json` **não tipa as respostas** desses endpoints, a renderização
será **defensiva**: exibo apenas as chaves presentes em cada resposta; campo
ausente simplesmente não aparece (sem placeholder falso).

### Campos que pretendo exibir (rótulo ↔ campo — **a confirmar no backend**)
- **Instruções Wire/ACH:** titular/beneficiário, banco (nome/endereço), nº da conta, routing/ABA, IBAN, SWIFT/BIC, referência/memo, valor, moeda, rail.
- **USDT:** rede, endereço da carteira, valor.
- **Comuns:** `ticketId`, `status`, `shareToken`, expiração do link.
- **PIX key:** chave, tipo.
- **Nunca** reconstruo taxas/prazos/valores — só se vierem na resposta.

Cada campo copiável tem botão **Copiar** (com toast).

## 5. Idempotency-Key (gerada no BFF)
- **Rota BFF dedicada** (ex.: `POST /api/receive/request-payment`) que gera a
  `Idempotency-Key` **no servidor** (UUID v4) e a anexa ao repassar para o
  backend — não passa pelo proxy genérico, garantindo que a key nasce no servidor.
- **Decisão pendente:** se o BFF gerar key nova a cada chamada, um retry de rede
  perde a idempotência. Proposta: key **estável por submissão** (o cliente manda
  um token de correlação por tentativa lógica; o BFF deriva/propaga a **mesma**
  `Idempotency-Key` nos retries). *Confirmar se o backend espera a mesma key por
  tentativa lógica.*

## 6. Estados de tela
- **Chave PIX padrão:** sem chave (CTA cadastrar) / com chave (editar, remover) / salvando / erro.
- **Criar recebimento:** form / enviando / sucesso (vai para `/recebimentos/[ticketId]`) / erro (mensagem genérica se sem `code`).
- **Instruções:** carregando / exibidas (campos + copiar) / erro.
- **Status:** badge do valor retornado + "Atualizar".
- **Link público:** válido (instruções) / **expirado → "Renovar link"**.

---

## 7. Pendências para destravar a implementação
Itens **(1)–(3)** bloqueiam o PR (sem eles não dá para montar o form de criação nem mapear os campos de resposta):

1. **Shapes reais** de `RequestPaymentDto`, `SavePixKeyDto` e das **respostas** de `instructions`, `status`, `pix-key`, `request-payment`. (Apontar os DTOs/controllers no `bravachain-api` ou colar os JSONs.)
2. **Rails** suportados no `request-payment` (Wire / ACH / USDT?) e **moedas**.
3. **`renew-token`:** o `:id` é o mesmo `ticketId`?

Itens com **padrão assumido** (seguem assim se você não objetar):

4. **Idempotency-Key:** mesma key por tentativa lógica (seção 5).
5. **Flag:** `NEXT_PUBLIC_FEATURE_RECEBIMENTOS` (OFF). **Rotas:** `/recebimentos`, `/recebimentos/[ticketId]`, `/pagar/[shareToken]`.

> Ao receber (1)–(3), abro o PR de implementação com a seção **atrás da flag desligada**, sem criar recebimentos reais.
