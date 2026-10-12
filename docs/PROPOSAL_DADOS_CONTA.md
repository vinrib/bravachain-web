# Proposta — Dados de conta (USD / EUR / BRL)

> **Documento de proposta (somente leitura).** Nenhuma tela foi implementada.
> Baseado no canvas do Claude Design (turn `16` — "Dados de conta") e no
> contrato real do backend. Pontos que dependem de você estão marcados com ⚠️.

Seção 3 da ordem do [gap map](./DESIGN_GAP_MAP.md).

---

## 1. Feature flag (desligada por padrão)
- **`NEXT_PUBLIC_FEATURE_DADOS_CONTA`** (`"true"`/`"false"`) — **default OFF**.
- OFF → item **some do menu** e a rota **dá 404**. Liga quando a Avenia criar as contas dedicadas.

## 2. Contrato (backend, PR #40 mergeado)
`GET /v1/receive/accounts` (Bearer + KYB) →
```
{
  accounts: [{
    currency: 'USD' | 'EUR',
    bankName?, beneficiaryName?, accountNumber?, routingNumber?,
    iban?, swift?, reference?, confirmedAt?
  }],
  pendingCurrencies: ['USD' | 'EUR' ...]
}
```
Renderização **defensiva**: mostro **só os campos que vierem**. Moeda em `pendingCurrencies` → card **"Conta em configuração"** (sem valores, sem copiar).

## 3. Rota e layout
- Rota: **`/dados-de-conta`** (uma página com seções por moeda: **USD**, **EUR**, **BRL**).
- Cada moeda confirmada = um card com os campos presentes; cada campo com **botão Copiar** (reaproveito o `CopyField` dos Recebimentos).
- Aviso de segurança curto no topo (ver §7).

## 4. Mapeamento canvas → contrato
| Canvas (USD/EUR) | Campo do contrato | Exibe? |
|------------------|-------------------|--------|
| Titular | `beneficiaryName` | ✅ se vier |
| Número da conta | `accountNumber` | ✅ se vier |
| Routing number (ABA) | `routingNumber` | ✅ se vier (USD) |
| IBAN | `iban` | ✅ se vier (EUR) |
| (SWIFT/BIC) | `swift` | ✅ se vier |
| Referência | `reference` | ✅ se vier |
| "Nome e endereço do banco" | `bankName` **(só o nome)** | ⚠️ **endereço não existe no contrato** → mostro só `bankName` |
| "Conta corrente (checking)" | — | ⚠️ **não existe** no contrato → omito |
| `confirmedAt` | — | metadado: "Confirmada em {data}" (discreto), se vier |

Rótulos: Titular, Banco, Número da conta, Routing (ABA), IBAN, SWIFT/BIC, Referência.

## 5. Moeda pendente / "A confirmar"
- `pendingCurrencies` inclui a moeda → card **"Conta em configuração"**, **sem** valores e **sem** copiar.
- Texto proposto (⚠️ aprovar): *"Estamos preparando sua conta em {moeda}. Avisaremos assim que estiver pronta para receber."*

## 6. BRL — depende de backend
O canvas mostra dados de conta **BRL**, mas **o backend não tem endpoint** para isso. → A seção BRL aparece como **"Depende de backend"** (placeholder), **sem nenhum dado BRL fictício**. Implemento quando houver endpoint.

## 7. ⚠️ O canvas mostra, mas NÃO há dado real — decidir antes de codar
O canvas (turn 16) traz blocos que **nenhum endpoint fornece**. Pela sua regra ("não inventar"), **não vou exibi-los** a menos que você aprove como **texto fixo** (e me passe o texto exato) — ou mando **omitir**:

1. **Tarifas** — canvas: "Wire doméstico (EUA): Sem tarifa Bravachain" · "ACH: Sem tarifa Bravachain".
2. **Tempo** — canvas: "Wire doméstico: No mesmo dia útil, se enviado até 17h (ET)" · "ACH: 1 a 3 dias úteis".
3. **Limites** — canvas: "Por pagamento: Sem valor mínimo" · "Por mês: Conforme o limite da sua empresa".
4. **Disponibilidade** — canvas: "Wire doméstico (Fedwire)" · "ACH" · "SWIFT internacional · em breve".
5. **Endereço do banco** — canvas mostra endereço completo; contrato só tem `bankName`. → por ora **omito o endereço**.
6. **Tipo de conta** ("Conta corrente / checking") — não existe no contrato → **omito**.
7. **Saldo disponível por moeda** — canvas mostra "Saldo disponível {{usd}}". Não vem de `/accounts`; poderia vir de `/v1/wallet` (saldo por moeda). ⚠️ Incluir (de `/v1/wallet`) ou **omitir** nesta tela?

**Para cada item 1–4:** você aprova como **texto fixo** (me dê o texto final) ou **omito**? Textos descritivos neutros que pretendo manter como UI fixa (sem aprovação, por não serem promessa de tarifa/prazo): "Receba USD — dos Estados Unidos por Wire ou ACH" / equivalente EUR, e "Os dados não foram aceitos? Fale com o suporte" (⚠️ confirmar o canal de suporte).

## 8. Copiar + segurança
- **Copiar por campo** (toast ao copiar). Também posso ter um "Copiar todos" (⚠️ quer?).
- **Aviso de segurança curto** (⚠️ aprovar o texto): *"Compartilhe estes dados apenas com quem vai te pagar. A Bravachain nunca pede que você transfira dinheiro para 'validar' a conta."*

## 9. Pendências antes de codar
1. ⚠️ Itens **1–4** da §7: texto fixo aprovado (qual?) ou omitir?
2. ⚠️ Saldo por moeda nesta tela (§7.7): incluir de `/v1/wallet` ou omitir?
3. ⚠️ Texto do card "Conta em configuração" (§5), do aviso de segurança (§8) e canal de "Fale com o suporte" (§7).
4. ⚠️ "Copiar todos" (§8): quer?
5. Confirmar rota `/dados-de-conta` e flag `NEXT_PUBLIC_FEATURE_DADOS_CONTA`.

> Com isso confirmado, abro o PR de implementação: seção **atrás da flag desligada**, USD/EUR do `/v1/receive/accounts`, BRL marcada "depende de backend", e **nada de dado inventado**.
