export type AdministrationRoute =
  | "OPHTHALMIC"
  | "ORAL"
  | "TOPICAL"
  | "OTIC"
  | "INJECTABLE"
  | "OTHER";

export const ADMINISTRATION_ROUTE_LABELS: Record<AdministrationRoute, string> = {
  OPHTHALMIC: "Oftálmico",
  ORAL: "Oral",
  TOPICAL: "Tópico",
  OTIC: "Ótico",
  INJECTABLE: "Injetável",
  OTHER: "Outro",
};
