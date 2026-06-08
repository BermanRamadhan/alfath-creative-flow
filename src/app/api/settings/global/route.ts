import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeWhatsappNumber, stringFromForm } from "@/lib/utils";

export async function POST(request: Request) {
  await requireRole(["ADMIN"]);
  const form = await request.formData();
  const url = new URL(request.url);
  const adminWhatsappNumber = normalizeWhatsappNumber(stringFromForm(form.get("adminWhatsappNumber")));
  await db.appSetting.upsert({
    where: { key: "admin_whatsapp_number" },
    update: { value: adminWhatsappNumber },
    create: { key: "admin_whatsapp_number", value: adminWhatsappNumber }
  });
  return NextResponse.redirect(new URL("/settings", url), { status: 303 });
}
