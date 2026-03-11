import type { AdherenceResult } from "@/core/value-objects/adherence";

interface DoseForAdherence {
  status: "PENDING" | "APPLIED" | "MISSED" | "SKIPPED" | "CANCELED";
  scheduledFor: Date;
}

export function calculateAdherence(
  doses: DoseForAdherence[],
  now: Date
): AdherenceResult {
  const relevant = doses.filter(
    (d) =>
      d.scheduledFor <= now &&
      (d.status === "APPLIED" || d.status === "MISSED" || d.status === "SKIPPED")
  );

  const denominator = relevant.length;
  const numerator = relevant.filter((d) => d.status === "APPLIED").length;
  const percentage = denominator === 0 ? null : (numerator / denominator) * 100;

  return { numerator, denominator, percentage };
}
