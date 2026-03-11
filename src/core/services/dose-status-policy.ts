import type { DoseStatus, ApplicationTiming } from "@/core/value-objects/dose-status";

export interface DoseApplyResult {
  status: DoseStatus;
  applicationTiming: ApplicationTiming;
  appliedAt: Date;
}

export function computeDoseApplication(
  currentStatus: DoseStatus,
  scheduledFor: Date,
  toleranceWindowMins: number,
  now: Date
): DoseApplyResult {
  if (currentStatus === "CANCELED") {
    throw new Error("Não é possível aplicar uma dose cancelada.");
  }
  if (currentStatus === "SKIPPED") {
    throw new Error("Não é possível aplicar uma dose ignorada.");
  }
  if (currentStatus === "APPLIED") {
    throw new Error("Esta dose já foi aplicada.");
  }

  const toleranceMs = toleranceWindowMins * 60 * 1000;
  const deadline = new Date(scheduledFor.getTime() + toleranceMs);
  const isLate = now > deadline;

  return {
    status: "APPLIED",
    applicationTiming: isLate ? "LATE" : "ON_TIME",
    appliedAt: now,
  };
}

export function isDoseOverdue(
  scheduledFor: Date,
  toleranceWindowMins: number,
  now: Date
): boolean {
  const toleranceMs = toleranceWindowMins * 60 * 1000;
  return now > new Date(scheduledFor.getTime() + toleranceMs);
}
