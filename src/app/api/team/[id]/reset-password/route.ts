import { NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  await requireRole(["ADMIN"]);
  const form = await request.formData();
  const url = new URL(request.url);
  await db.user.update({
    where: { id: params.id },
    data: { passwordHash: await hashPassword(stringFromForm(form.get("password"))) }
  });
  await db.session.deleteMany({ where: { userId: params.id } });
  return NextResponse.redirect(new URL(`/team/${params.id}`, url), { status: 303 });
}
