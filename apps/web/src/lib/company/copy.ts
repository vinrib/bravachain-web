/**
 * Centralized pt-BR copy for the Empresa screen (`/empresa`).
 *
 * Regulatory guardrail: Bravachain is a technology platform; custody, settlement,
 * onboarding approval, document analysis and operational limits are exclusively
 * handled and decided by Avenia. Never use prohibited terms (`spread`, `câmbio`,
 * `taxa de conversão`, `estamos analisando`, `aprovamos`, `reprovamos`, etc.).
 */
export const COMPANY_COPY = {
  page: {
    title: "Empresa",
    subtitle:
      "Dados cadastrais, documentos enviados e limites informados pela Avenia.",
    aveniaStatusPrefix: "Status do cadastro na Avenia:",
    retryAction: "Tentar de novo",
    loadingLabel: "Carregando informações da empresa…",
    loadError: "Não foi possível carregar os dados da empresa no momento.",
  },

  aveniaStatus: {
    approved: "Aprovado pela Avenia",
    inAnalysis: "Em análise",
    pending: "Pendências",
    unavailable: "Status indisponível no momento",
  },

  tabs: {
    perfil: "Perfil",
    documentos: "Documentos",
    pendencias: "Pendências",
    limites: "Limites",
  },

  profile: {
    sectionLabel: "Dados cadastrais da empresa titular",
    fields: {
      legalName: "Razão Social",
      cnpj: "CNPJ",
      email: "E-mail",
      cnae: "Atividade Principal (CNAE)",
    },
    loadError: "Não foi possível carregar os dados cadastrais no momento.",
    empty: "Nenhum dado cadastral disponível no momento.",
  },

  pep: {
    title: "Declaração de PEP dos sócios e beneficiários finais",
    subtitle:
      "Informe a condição de Pessoa Politicamente Exposta (PEP) dos representantes e beneficiários finais.",
    statusNotPep: "Declaração registrada",
    statusIsPep: "Marcado como PEP (rascunho local)",
    togglePrefix: "Declarado PEP:",
    yes: "SIM",
    no: "NÃO",
    declarationCheckbox:
      "Declaro que as informações sobre a condição de Pessoa Politicamente Exposta (PEP) dos representantes e beneficiários finais estão corretas e atualizadas.",
    empty: "Nenhum sócio ou beneficiário final cadastrado.",
  },

  documents: {
    title: "Documentos",
    subtitle:
      "Os documentos enviados são encaminhados para análise pela Avenia.",
    awaitingUpload: "Aguardando envio",
    uploadAction: "Enviar arquivo",
    uploadingAction: "Enviando…",
    acceptedHint: "PDF, JPEG ou PNG (máx. 10 MB)",
    status: {
      uploadedPrefix: "Enviado em",
      uploadedFallback: "Enviado",
      pending: "Pendente de envio",
    },
    loadError: "Não foi possível carregar os documentos no momento.",
    empty: "Nenhum documento registrado no momento.",
    toastUploaded: "Documento enviado. A análise é feita pela Avenia.",
    errors: {
      invalidType: "Formato não suportado. Envie um arquivo PDF, JPEG ou PNG.",
      fileTooLarge: "Arquivo excede o limite máximo de 10 MB.",
      emptyFile: "O arquivo selecionado está vazio.",
      uploadFailed: "Não foi possível enviar o documento. Tente novamente.",
    },
  },

  pending: {
    title: "Pendências",
    subtitle: "Documentos aguardando envio para análise pela Avenia.",
    uploadAction: "Enviar documento",
    loadError: "Não foi possível carregar as pendências no momento.",
    emptyTitle: "Nenhum documento pendente de envio.",
    emptyDescription:
      "Todos os documentos solicitados já foram enviados para a Avenia.",
  },

  limits: {
    title: "Limites da sua conta",
    subtitle: "Limites definidos pela Avenia.",
    reviewAction: "Como revisar meus limites",
    tableHeaders: {
      scope: "Moeda / Escopo",
      entry: "Entrada",
      exit: "Saída",
    },
    globalLabel: "Global (USD)",
    loadError: "Não foi possível carregar os limites no momento.",
    empty: "Nenhum limite disponível no momento.",
    modal: {
      title: "Como revisar meus limites",
      description:
        "A revisão de limites é decidida pela Avenia. Mantenha seus documentos e demonstrações financeiras atualizados na aba Documentos.",
      goToDocuments: "Ir para Documentos",
      close: "Entendi",
    },
  },
} as const;
