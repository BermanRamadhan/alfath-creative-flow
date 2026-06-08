import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { submitTask } from "@/lib/workflow";
import { parseLinks, stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "CC"]);
  const form = await request.formData();
  const url = new URL(request.url);
  await submitTask(user.id, params.id, {
    lpLink: stringFromForm(form.get("lpLink")),
    videoLinks: parseLinks(form.get("videoLinks")),
    imageLinks: parseLinks(form.get("imageLinks")),
    additionalLinks: parseLinks(form.get("additionalLinks")),
    note: stringFromForm(form.get("note"))
  });
  const notifyUrl = new URL("/notifications/whatsapp", url);
  notifyUrl.searchParams.set("event", "task_submitted");
  notifyUrl.searchParams.set("task", params.id);
  notifyUrl.searchParams.set("next", `/tasks/${params.id}`);
  return NextResponse.redirect(notifyUrl, { status: 303 });
}
