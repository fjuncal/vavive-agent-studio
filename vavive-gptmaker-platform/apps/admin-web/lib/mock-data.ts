export const dashboardSummary = {
  totalLeads: 128,
  newLeads: 19,
  activeLeads: 34,
  finishedChats: 71,
  conversionRate: "18,4%"
};

export const evolution = [
  { label: "Seg", value: 36 },
  { label: "Ter", value: 48 },
  { label: "Qua", value: 42 },
  { label: "Qui", value: 63 },
  { label: "Sex", value: 58 },
  { label: "Sab", value: 44 },
  { label: "Dom", value: 31 }
];

export const franchises = [
  {
    id: "vila-mariana",
    name: "Vavive Vila Mariana",
    city: "Sao Paulo",
    state: "SP",
    owner: "Gestora Vila Mariana",
    status: "ATIVA",
    leads: 52
  },
  {
    id: "pinheiros",
    name: "Vavive Pinheiros",
    city: "Sao Paulo",
    state: "SP",
    owner: "Operacao Pinheiros",
    status: "ATIVA",
    leads: 41
  }
];

export const agents = [
  {
    id: "agent-vila-mariana",
    name: "Assistente Vavive Vila Mariana",
    franchise: "Vavive Vila Mariana",
    externalId: "gptmaker-agent-mock-vila-mariana",
    status: "ATIVO",
    tone: "Acolhedor, objetivo e consultivo",
    lastSync: "Hoje, 14:20"
  },
  {
    id: "agent-pinheiros",
    name: "Assistente Vavive Pinheiros",
    franchise: "Vavive Pinheiros",
    externalId: "gptmaker-agent-mock-pinheiros",
    status: "ATIVO",
    tone: "Calmo, claro e resolutivo",
    lastSync: "Ontem, 18:10"
  }
];

export const leads = [
  { name: "Mariana Alves", phone: "+55 11 90000-1001", service: "Acompanhante hospitalar", source: "WhatsApp", status: "NOVO", franchise: "Vavive Vila Mariana" },
  { name: "Ricardo Lima", phone: "+55 11 90000-1002", service: "Cuidador por hora", source: "Instagram", status: "EM_ATENDIMENTO", franchise: "Vavive Vila Mariana" },
  { name: "Beatriz Souza", phone: "+55 11 90000-1003", service: "Cuidador noturno", source: "WhatsApp", status: "CONVERTIDO", franchise: "Vavive Pinheiros" },
  { name: "Carlos Mendes", phone: "+55 11 90000-1004", service: "Pos-cirurgico", source: "Site", status: "FINALIZADO", franchise: "Vavive Vila Mariana" }
];

export const intentTemplates = [
  { title: "Preço", description: "Identifica perguntas sobre valores, pacotes e cobranca por hora.", example: "Quanto custa um cuidador por 6 horas?" },
  { title: "Agendamento", description: "Reconhece quando a pessoa quer marcar, reservar ou verificar disponibilidade.", example: "Consigo agendar para amanha cedo?" },
  { title: "Regiao atendida", description: "Detecta bairro, cidade, CEP e cobertura operacional da franquia.", example: "Voces atendem no Tatuape?" },
  { title: "Falar com humano", description: "Encaminha pedidos de atendimento humano para a equipe da franquia.", example: "Quero falar com uma pessoa." },
  { title: "Duvida geral", description: "Classifica perguntas institucionais ou operacionais fora dos fluxos principais.", example: "Como funciona a Vavive?" }
];

export const ruleTemplates = [
  ["Nunca inventar preço", "Se nao houver preco cadastrado, pedir contexto ou transferir para humano."],
  ["Nunca confirmar agenda sem validacao", "Disponibilidade precisa ser confirmada pela equipe da franquia."],
  ["Perguntar servico quando faltar", "Antes de orientar valor ou agenda, identificar o tipo de cuidado."],
  ["Perguntar horas quando faltar", "Coletar periodo estimado para montar a solicitacao corretamente."],
  ["Perguntar bairro ou CEP quando faltar", "Validar cobertura antes de prometer atendimento."],
  ["Transferir reclamacao para humano", "Sinais de insatisfacao devem virar atendimento humano rapidamente."]
];

export const setupSteps = [
  "Dados da franquia",
  "Servicos",
  "Precos por hora",
  "Regioes atendidas",
  "Horarios",
  "FAQ",
  "Regras do agente",
  "Tom de voz",
  "Revisao"
];
