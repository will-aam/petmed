export type DoseStatus =
  | "PENDING"
  | "APPLIED"
  | "MISSED"
  | "SKIPPED"
  | "CANCELED";

export type ApplicationTiming = "ON_TIME" | "LATE";

export const DOSE_STATUS_LABELS: Record<DoseStatus, string> = {
  PENDING: "Pendente",
  APPLIED: "Aplicado",
  MISSED: "Perdido",
  SKIPPED: "Ignorado",
  CANCELED: "Cancelado",
};
