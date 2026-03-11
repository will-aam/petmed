import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth-config";
import {
  activateTreatment,
  pauseTreatment,
  resumeTreatment,
  closeTreatment,
  cancelTreatment,
  getTreatmentDetail,
} from "@/application/use-cases/treatment";
import { calculateTreatmentAdherence } from "@/application/use-cases/dose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const treatment = await getTreatmentDetail(session.user.id, id);
    return NextResponse.json(treatment);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}
