import { NextResponse } from "next/server";
import { requireUser, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeWhatsappNumber, stringFromForm } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  const url = new URL(request.url);
  const password = stringFromForm(form.get("password"));
  await db.user.update({
    where: { id: user.id },
    data: {
      username: stringFromForm(form.get("username")),
      displayName: stringFromForm(form.get("displayName")),
      whatsappNumber: normalizeWhatsappNumber(stringFromForm(form.get("whatsappNumber"))),
      darkMode: stringFromForm(form.get("darkMode")) === "true",
      ...(password ? { passwordHash: await hashPassword(password) } : {})
    }
  });
  return NextResponse.redirect(new URL("/settings", url), { status: 303 });
}
