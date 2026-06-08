import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { MATERIAL_TYPES, PLATFORMS, isOneOf } from "@/lib/constants";
import { db } from "@/lib/db";
import { ensureProductByName } from "@/lib/workflow";
import { externalHref, optionalString, productSlug, stringFromForm } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  const url = new URL(request.url);
  const product = await ensureProductByName(stringFromForm(form.get("productName")));
  const materialType = stringFromForm(form.get("materialType"));
  const platform = stringFromForm(form.get("platform"));
  await db.materialReference.create({
    data: {
      materialType: isOneOf(materialType, MATERIAL_TYPES) ? materialType : "REFERENSI",
      sourceType: "MANUAL",
      productId: product.id,
      productName: product.name,
      productKey: productSlug(product.name),
      title: stringFromForm(form.get("title")),
      url: externalHref(stringFromForm(form.get("url"))),
      platform: isOneOf(platform, PLATFORMS) ? platform : null,
      note: optionalString(stringFromForm(form.get("note"))),
      requesterId: user.role === "ADVERTISER" ? user.id : null,
      creatorId: user.role === "CC" ? user.id : null
    }
  });
  return NextResponse.redirect(new URL("/materials", url), { status: 303 });
}
