import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth-config";
import { prisma } from "@/infrastructure/prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: session.user.id } });
  if (!tutorProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const treatment = await prisma.treatment.findFirst({
    where: { id: id, pet: { tutorProfileId: tutorProfile.id } },
  });
  if (!treatment) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const doses = await prisma.dose.findMany({
    where: { tutorProfileId: tutorProfile.id, treatmentItem: { treatmentId: id } },
    include: {
      treatmentItem: {
        select: { medicationName: true, dosageAmount: true, dosageUnit: true }
      }
    },
    orderBy: { scheduledFor: "desc" },
  });

  return NextResponse.json(doses);
}
