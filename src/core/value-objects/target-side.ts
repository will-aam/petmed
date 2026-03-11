export type TargetSide = "RIGHT" | "LEFT" | "BILATERAL" | "NONE";

export const TARGET_SIDE_LABELS: Record<TargetSide, string> = {
  RIGHT: "Olho direito",
  LEFT: "Olho esquerdo",
  BILATERAL: "Ambos os olhos",
  NONE: "N/A",
};
