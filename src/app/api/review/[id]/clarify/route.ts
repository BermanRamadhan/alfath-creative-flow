import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { clarifyRevision } from "@/lib/workflow";
import { stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const form = await request.formData();
  const url = new URL(request.url);
  await clarifyRevision(user.id, params.id, stringFromForm(form.get("clarificationNote")));
  return NextResponse.redirect(new URL(`/review/${params.id}`, url), { status: 303 });
}
