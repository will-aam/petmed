import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth-config";
import { activateTreatment } from "@/application/use-cases/treatment";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const result = await activateTreatment(session.user.id, id);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
