import { prisma } from "@/infrastructure/prisma/client";
import { computeDoseApplication, isDoseOverdue } from "@/core/services/dose-status-policy";
import { calculateAdherence } from "@/core/services/adherence-calculator";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export async function markDoseApplied(userId: string, doseId: string, note?: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");

  const dose = await prisma.dose.findFirst({
    where: { id: doseId, tutorProfileId: tutorProfile.id },
    include: { treatmentItem: true },
  });
  if (!dose) throw new Error("Dose não encontrada.");

  const now = new Date();
  const result = computeDoseApplication(
    dose.status as "PENDING" | "APPLIED" | "MISSED" | "SKIPPED" | "CANCELED",
    dose.scheduledFor,
    dose.treatmentItem.toleranceWindowMins,
    now
  );

  return prisma.dose.update({
    where: { id: doseId },
    data: {
      status: result.status,
      applicationTiming: result.applicationTiming,
      appliedAt: result.appliedAt,
      confirmedByUserId: userId,
      note: note ?? null,
    },
  });
}

export async function markDoseSkipped(userId: string, doseId: string, note?: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");

  const dose = await prisma.dose.findFirst({
    where: { id: doseId, tutorProfileId: tutorProfile.id },
  });
  if (!dose) throw new Error("Dose não encontrada.");
  if (dose.status !== "PENDING") throw new Error("Apenas doses pendentes podem ser ignoradas.");

  return prisma.dose.update({
    where: { id: doseId },
    data: { status: "SKIPPED", skippedAt: new Date(), note: note ?? null },
  });
}

export async function markOverdueDoses() {
  const now = new Date();
  const pendingDoses = await prisma.dose.findMany({
    where: { status: "PENDING", scheduledFor: { lt: now } },
    include: { treatmentItem: { select: { toleranceWindowMins: true } } },
  });

  const overdueIds = pendingDoses
    .filter((d) => isDoseOverdue(d.scheduledFor, d.treatmentItem.toleranceWindowMins, now))
    .map((d) => d.id);

  if (overdueIds.length === 0) return { updated: 0 };

  await prisma.dose.updateMany({
    where: { id: { in: overdueIds } },
    data: { status: "MISSED" },
  });

  return { updated: overdueIds.length };
}

export async function getDaySchedule(userId: string, dateStr: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) return [];

  const tz = tutorProfile.timezone;
  const localDate = toZonedTime(new Date(dateStr), tz);
  const startUtc = fromZonedTime(startOfDay(localDate), tz);
  const endUtc = fromZonedTime(endOfDay(localDate), tz);

  return prisma.dose.findMany({
    where: {
      tutorProfileId: tutorProfile.id,
      scheduledFor: { gte: startUtc, lte: endUtc },
    },
    include: {
      pet: { select: { id: true, name: true, photoUrl: true } },
      treatmentItem: {
        select: {
          medicationName: true,
          dosageAmount: true,
          dosageUnit: true,
          administrationRoute: true,
          targetSide: true,
          instructions: true,
          toleranceWindowMins: true,
        },
      },
    },
    orderBy: { scheduledFor: "asc" },
  });
}

export async function calculateTreatmentAdherence(userId: string, treatmentId: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");

  const doses = await prisma.dose.findMany({
    where: {
      tutorProfileId: tutorProfile.id,
      treatmentItem: { treatmentId },
    },
    select: { status: true, scheduledFor: true },
  });

  return calculateAdherence(
    doses.map((d) => ({ status: d.status as Parameters<typeof calculateAdherence>[0][0]["status"], scheduledFor: d.scheduledFor })),
    new Date()
  );
}
