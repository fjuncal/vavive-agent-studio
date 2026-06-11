export type UserRole = "SUPER_ADMIN" | "ADMIN_FRANQUIA";
export type LeadStatus = "NOVO" | "EM_ATENDIMENTO" | "CONVERTIDO" | "FINALIZADO";

export type FranchiseSummary = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
};
