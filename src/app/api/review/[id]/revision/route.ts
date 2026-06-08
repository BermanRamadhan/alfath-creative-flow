import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { requestRevision } from "@/lib/workflow";
import { stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const form = await request.formData();
  const url = new URL(request.url);
  await requestRevision(user.id, params.id, stringFromForm(form.get("revisionNote")));
  const notifyUrl = new URL("/notifications/whatsapp", url);
  notifyUrl.searchParams.set("event", "revision_requested");
  notifyUrl.searchParams.set("task", params.id);
  notifyUrl.searchParams.set("next", `/review/${params.id}`);
  return NextResponse.redirect(notifyUrl, { status: 303 });
}
