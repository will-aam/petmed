import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth-config";
import { createTreatment, CreateTreatmentSchema } from "@/application/use-cases/treatment";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateTreatmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const treatment = await createTreatment(session.user.id, parsed.data);
    return NextResponse.json(treatment, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
