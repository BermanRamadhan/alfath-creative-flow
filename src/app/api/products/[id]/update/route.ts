import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { stringFromForm, optionalString } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  await requireRole(["ADMIN"]);
  const form = await request.formData();
  const url = new URL(request.url);
  await db.product.update({
    where: { id: params.id },
    data: {
      category: optionalString(stringFromForm(form.get("category"))),
      niche: optionalString(stringFromForm(form.get("niche"))),
      mainLpUrl: optionalString(stringFromForm(form.get("mainLpUrl"))),
      driveReferenceUrl: optionalString(stringFromForm(form.get("driveReferenceUrl"))),
      description: optionalString(stringFromForm(form.get("description"))),
      notes: optionalString(stringFromForm(form.get("notes"))),
      tags: optionalString(stringFromForm(form.get("tags")))
    }
  });
  return NextResponse.redirect(new URL(`/products/${params.id}`, url), { status: 303 });
}
