import { NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES, isOneOf } from "@/lib/constants";
import { normalizeWhatsappNumber, stringFromForm } from "@/lib/utils";

export async function POST(request: Request) {
  await requireRole(["ADMIN"]);
  const form = await request.formData();
  const url = new URL(request.url);
  const role = stringFromForm(form.get("role"));
  await db.user.create({
    data: {
      username: stringFromForm(form.get("username")),
      displayName: stringFromForm(form.get("displayName")),
      whatsappNumber: normalizeWhatsappNumber(stringFromForm(form.get("whatsappNumber"))),
      role: isOneOf(role, ROLES) ? role : "CC",
      passwordHash: await hashPassword(stringFromForm(form.get("password"))),
      isActive: true
    }
  });
  return NextResponse.redirect(new URL("/team", url), { status: 303 });
}
