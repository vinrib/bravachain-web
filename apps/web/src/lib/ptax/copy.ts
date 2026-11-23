/**
 * Centralized UI copy for the PTAX reference quotes experience (pt-BR).
 * Every visible string lives here and is scanned by `copy.test.ts` against the
 * regulatory prohibited-terms list from `bravachain-api/src/common/client-text-policy.ts`.
 */
export const PTAX_COPY = {
  page: {
    title: "Cotações de referência",
    subtitle:
      "Série oficial PTAX para consulta. Os valores são informativos e não representam a cotação aplicada em uma operação.",
    sourceLine: "Fonte: Banco Central do Brasil — PTAX",
    alertsSectionTitle: "Alertas",
  },
  header: {
    currencyTabsAriaLabel: "Selecionar moeda de referência",
    pairUnitPrefix: "1 ",
    pairUnitEquals: " = R$ ",
    lastUpdatePrefix: "Última atualização em ",
    lastUpdateTimezone: " (horário de Brasília)",
    provisionalBadge: "Valor parcial do dia",
    staleNotice:
      "Sem boletim oficial nos últimos dias úteis. Exibindo o último boletim registrado.",
    previousClosePrefix: "Fechamento anterior: R$ ",
    buyLabel: "Compra",
    sellLabel: "Venda",
    emptyValue: "—",
    noDataTitle: "Sem dados disponíveis",
    noDataDescription: "Ainda não há boletins oficiais registrados para esta moeda.",
  },
  periods: {
    groupAriaLabel: "Selecionar período do gráfico",
    labels: {
      "1D": "1D",
      "1W": "1W",
      "1M": "1M",
      "3M": "3M",
      "1Y": "1Y",
    },
    ariaLabels: {
      "1D": "1 dia",
      "1W": "1 semana",
      "1M": "1 mês",
      "3M": "3 meses",
      "1Y": "1 ano",
    },
  },
  chart: {
    stats: {
      min: "Mín",
      max: "Máx",
      avg: "Média",
      open: "Abertura",
    },
    referenceLineLabel: "Média",
    tooltip: {
      valueLabel: "Valor",
      bulletinTypeLabel: "Boletim",
      timeLabel: "Horário (Brasília)",
      provisionalTag: "Parcial",
    },
    emptyTitle: "Sem boletins no período",
    emptyDescription: "Não há boletins oficiais registrados para o intervalo selecionado.",
    singlePointNote:
      "Primeiro boletim do dia registrado. A curva contínua aparece a partir do segundo boletim.",
    ariaLabelTemplate: {
      prefix: "Gráfico da série PTAX de ",
      period: ", período ",
      min: ", mínimo R$ ",
      max: ", máximo R$ ",
      noData: "Gráfico da série PTAX sem dados no período selecionado.",
    },
  },
  monthlyAverage: {
    title: "Média de 12 meses",
    subtitle: "Média mensal dos fechamentos oficiais PTAX (R$).",
    average12mLabel: "Média 12 meses",
    latestVsAverageLabel: "Último vs. média 12m",
    partialBadge: "em andamento",
    businessDaysSuffix: " dias úteis",
    methodHeading: "Como é calculado",
    emptyTitle: "Sem histórico mensal",
    emptyDescription: "Não há meses disponíveis para cálculo da média.",
    ariaLabelPrefix: "Gráfico de barras da média mensal PTAX de ",
    ariaLabelAveragePrefix: ", média de 12 meses R$ ",
  },
  currencyGrid: {
    title: "Moedas",
    subtitle: "Selecione uma moeda para acompanhar o histórico e a média de 12 meses.",
    unavailable: "Sem dados",
  },
  calculator: {
    title: "Calculadora de referência",
    subtitle: "Simulação informativa utilizando o último boletim oficial PTAX.",
    amountLabel: "Valor",
    amountPlaceholder: "1000,00",
    fromLabel: "De",
    toLabel: "Para",
    swapAriaLabel: "Inverter moedas",
    resultLabel: "Resultado de referência",
    rateLabel: "Referência aplicada",
    bulletinTimePrefix: "Boletim de ",
    crossBadge: "Via BRL",
    invalidAmount:
      "Informe um valor positivo com até 15 dígitos inteiros e 6 casas decimais.",
    emptyPrompt: "Digite um valor para simular a referência PTAX.",
    calculating: "Calculando referência…",
    errorMessage: "Não foi possível calcular o valor de referência.",
  },
  errors: {
    retry: "Tentar de novo",
    generic: "Não foi possível carregar os dados PTAX.",
    rateLimited:
      "Muitas consultas seguidas. Aguarde alguns instantes e tente de novo.",
    serverUnavailable:
      "Serviço de cotações temporariamente indisponível. Tente de novo em instantes.",
    invalidPayload:
      "Os dados recebidos estão em formato inesperado. Tente de novo.",
  },
} as const;
