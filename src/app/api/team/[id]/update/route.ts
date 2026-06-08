import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES, isOneOf } from "@/lib/constants";
import { normalizeWhatsappNumber, stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  await requireRole(["ADMIN"]);
  const form = await request.formData();
  const url = new URL(request.url);
  const role = stringFromForm(form.get("role"));
  await db.user.update({
    where: { id: params.id },
    data: {
      username: stringFromForm(form.get("username")),
      displayName: stringFromForm(form.get("displayName")),
      whatsappNumber: normalizeWhatsappNumber(stringFromForm(form.get("whatsappNumber"))),
      role: isOneOf(role, ROLES) ? role : "CC",
      isActive: stringFromForm(form.get("isActive")) === "true"
    }
  });
  return NextResponse.redirect(new URL(`/team/${params.id}`, url), { status: 303 });
}
