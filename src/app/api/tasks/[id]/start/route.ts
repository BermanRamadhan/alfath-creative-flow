import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { startTask } from "@/lib/workflow";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "CC"]);
  const url = new URL(request.url);
  await startTask(user.id, params.id);
  return NextResponse.redirect(new URL(`/tasks/${params.id}`, url), { status: 303 });
}
