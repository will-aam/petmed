export type RecurrenceType = "INTERVAL" | "FIXED_TIMES";

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  INTERVAL: "Intervalo (horas)",
  FIXED_TIMES: "Horários fixos",
};
