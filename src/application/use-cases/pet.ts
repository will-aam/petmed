import { prisma } from "@/infrastructure/prisma/client";
import { z } from "zod";

export const CreatePetSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  species: z.string().min(1, "Espécie é obrigatória"),
  breed: z.string().optional(),
  age: z.number().int().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreatePetInput = z.infer<typeof CreatePetSchema>;

export async function createPet(userId: string, input: CreatePetInput) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");

  return prisma.pet.create({
    data: {
      tutorProfileId: tutorProfile.id,
      name: input.name,
      species: input.species,
      breed: input.breed,
      age: input.age,
      weight: input.weight,
      photoUrl: input.photoUrl,
      notes: input.notes,
    },
  });
}

export async function listPets(userId: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) return [];

  return prisma.pet.findMany({
    where: { tutorProfileId: tutorProfile.id },
    include: {
      treatments: {
        where: { status: { in: ["ACTIVE", "PAUSED"] } },
        select: { id: true, title: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPetDetail(userId: string, petId: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!tutorProfile) throw new Error("Perfil de tutor não encontrado.");

  const pet = await prisma.pet.findFirst({
    where: { id: petId, tutorProfileId: tutorProfile.id },
    include: {
      treatments: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { fixedTimes: true } } },
      },
    },
  });

  if (!pet) throw new Error("Animal não encontrado.");
  return pet;
}
