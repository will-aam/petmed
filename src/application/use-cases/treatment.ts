import { prisma } from "@/infrastructure/prisma/client";
import { generateDoses } from "@/core/services/schedule-generator";
import { z } from "zod";

export const TreatmentItemSchema = z.object({
  medicationName: z.string().min(1),
  administrationRoute: z.enum(["OPHTHALMIC", "ORAL", "TOPICAL", "OTIC", "INJECTABLE", "OTHER"]),
  targetSide: z.enum(["RIGHT", "LEFT", "BILATERAL", "NONE"]).default("NONE"),
  dosageAmount: z.number().positive(),
  dosageUnit: z.string().min(1),
  recurrenceType: z.enum(["INTERVAL", "FIXED_TIMES"]),
  intervalHours: z.number().int().positive().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  instructions: z.string().optional().nullable(),
  toleranceWindowMins: z.number().int().positive().default(60),
  fixedTimes: z
    .array(z.object({ timeOfDay: z.string(), orderIndex: z.number().int() }))
    .optional(),
});

export const CreateTreatmentSchema = z.object({
  petId: z.string(),
  title: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  items: z.array(TreatmentItemSchema).min(1),
});

export type CreateTreatmentInput = z.infer<typeof CreateTreatmentSchema>;

export async function createTreatment(userId: string, input: CreateTreatmentInput) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");

  const pet = await prisma.pet.findFirst({
    where: { id: input.petId, tutorProfileId: tutorProfile.id },
  });
  if (!pet) throw new Error("Animal não encontrado.");

  return prisma.treatment.create({
    data: {
      petId: input.petId,
      title: input.title,
      status: "DRAFT",
      startDate: input.startDate,
      endDate: input.endDate,
      items: {
        create: input.items.map((item) => ({
          medicationName: item.medicationName,
          administrationRoute: item.administrationRoute,
          targetSide: item.targetSide,
          dosageAmount: item.dosageAmount,
          dosageUnit: item.dosageUnit,
          recurrenceType: item.recurrenceType,
          intervalHours: item.intervalHours,
          startDate: item.startDate,
          endDate: item.endDate,
          instructions: item.instructions,
          toleranceWindowMins: item.toleranceWindowMins,
          fixedTimes: item.fixedTimes
            ? { create: item.fixedTimes }
            : undefined,
        })),
      },
    },
    include: { items: { include: { fixedTimes: true } } },
  });
}

export async function activateTreatment(userId: string, treatmentId: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");

  const treatment = await prisma.treatment.findFirst({
    where: { id: treatmentId, pet: { tutorProfileId: tutorProfile.id } },
    include: { items: { include: { fixedTimes: true } } },
  });
  if (!treatment) throw new Error("Tratamento não encontrado.");
  if (treatment.status !== "DRAFT") throw new Error("Apenas tratamentos em rascunho podem ser ativados.");

  // Generate doses for each item
  const allDoses = treatment.items.flatMap((item) =>
    generateDoses({
      id: item.id,
      treatmentItemId: item.id,
      petId: treatment.petId,
      tutorProfileId: tutorProfile.id,
      recurrenceType: item.recurrenceType as "INTERVAL" | "FIXED_TIMES",
      intervalHours: item.intervalHours,
      fixedTimes: item.fixedTimes,
      startDate: item.startDate,
      endDate: item.endDate,
      timezone: tutorProfile.timezone,
    })
  );

  await prisma.$transaction([
    prisma.treatment.update({
      where: { id: treatmentId },
      data: { status: "ACTIVE" },
    }),
    prisma.dose.createMany({ data: allDoses }),
  ]);

  return prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: { items: true },
  });
}

export async function pauseTreatment(userId: string, treatmentId: string) {
  const { tutorProfile, treatment } = await requireTreatmentOwnership(userId, treatmentId, "ACTIVE");
  await prisma.$transaction([
    prisma.treatment.update({ where: { id: treatmentId }, data: { status: "PAUSED" } }),
    prisma.dose.updateMany({
      where: { treatmentItem: { treatmentId }, status: "PENDING", scheduledFor: { gt: new Date() } },
      data: { status: "CANCELED" },
    }),
  ]);
  return { success: true };
}

export async function resumeTreatment(userId: string, treatmentId: string) {
  const { tutorProfile, treatment } = await requireTreatmentOwnership(userId, treatmentId, "PAUSED");
  const items = await prisma.treatmentItem.findMany({
    where: { treatmentId },
    include: { fixedTimes: true },
  });

  const now = new Date();
  const allDoses = items.flatMap((item) =>
    generateDoses({
      id: item.id,
      treatmentItemId: item.id,
      petId: treatment.petId,
      tutorProfileId: tutorProfile.id,
      recurrenceType: item.recurrenceType as "INTERVAL" | "FIXED_TIMES",
      intervalHours: item.intervalHours,
      fixedTimes: item.fixedTimes,
      startDate: now > item.startDate ? now : item.startDate,
      endDate: item.endDate,
      timezone: tutorProfile.timezone,
    })
  );

  await prisma.$transaction([
    prisma.treatment.update({ where: { id: treatmentId }, data: { status: "ACTIVE" } }),
    prisma.dose.createMany({ data: allDoses }),
  ]);
  return { success: true };
}

export async function closeTreatment(userId: string, treatmentId: string) {
  const { treatment } = await requireTreatmentOwnership(userId, treatmentId, "ACTIVE");
  await prisma.$transaction([
    prisma.treatment.update({ where: { id: treatmentId }, data: { status: "COMPLETED" } }),
    prisma.dose.updateMany({
      where: { treatmentItem: { treatmentId }, status: "PENDING", scheduledFor: { gt: new Date() } },
      data: { status: "CANCELED" },
    }),
  ]);
  return { success: true };
}

export async function cancelTreatment(userId: string, treatmentId: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");
  const treatment = await prisma.treatment.findFirst({
    where: { id: treatmentId, pet: { tutorProfileId: tutorProfile.id } },
  });
  if (!treatment) throw new Error("Tratamento não encontrado.");
  if (treatment.status === "COMPLETED" || treatment.status === "CANCELED") {
    throw new Error("Não é possível cancelar este tratamento.");
  }

  await prisma.$transaction([
    prisma.treatment.update({ where: { id: treatmentId }, data: { status: "CANCELED" } }),
    prisma.dose.updateMany({
      where: { treatmentItem: { treatmentId }, status: "PENDING" },
      data: { status: "CANCELED" },
    }),
  ]);
  return { success: true };
}

export async function getTreatmentDetail(userId: string, treatmentId: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");

  const treatment = await prisma.treatment.findFirst({
    where: { id: treatmentId, pet: { tutorProfileId: tutorProfile.id } },
    include: { items: { include: { fixedTimes: true } }, pet: true },
  });
  if (!treatment) throw new Error("Tratamento não encontrado.");
  return treatment;
}

async function requireTreatmentOwnership(
  userId: string,
  treatmentId: string,
  expectedStatus: string
) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");
  const treatment = await prisma.treatment.findFirst({
    where: { id: treatmentId, pet: { tutorProfileId: tutorProfile.id } },
  });
  if (!treatment) throw new Error("Tratamento não encontrado.");
  if (treatment.status !== expectedStatus) {
    throw new Error(`Tratamento deve estar com status ${expectedStatus} para esta ação.`);
  }
  return { tutorProfile, treatment };
}
