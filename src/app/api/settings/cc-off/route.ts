import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { setCreatorOff } from "@/lib/workflow";
import { stringFromForm } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await requireRole(["CC"]);
  const form = await request.formData();
  const url = new URL(request.url);
  const expected = stringFromForm(form.get("expectedUntil"));
  await setCreatorOff(user.id, {
    reason: stringFromForm(form.get("reason")),
    note: stringFromForm(form.get("note")),
    expectedUntil: expected ? new Date(expected) : null
  });
  return NextResponse.redirect(new URL("/settings", url), { status: 303 });
}
