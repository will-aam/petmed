import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth-config";
import { pauseTreatment } from "@/application/use-cases/treatment";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await pauseTreatment(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
