import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { returnRevision } from "@/lib/workflow";
import { stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "CC"]);
  const form = await request.formData();
  const url = new URL(request.url);
  await returnRevision(user.id, params.id, stringFromForm(form.get("returnNote")));
  const notifyUrl = new URL("/notifications/whatsapp", url);
  notifyUrl.searchParams.set("event", "revision_returned");
  notifyUrl.searchParams.set("task", params.id);
  notifyUrl.searchParams.set("next", `/tasks/${params.id}`);
  return NextResponse.redirect(notifyUrl, { status: 303 });
}
