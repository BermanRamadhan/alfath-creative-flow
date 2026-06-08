import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createLpRequest } from "@/lib/workflow";
import { parseLinks, stringFromForm } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const form = await request.formData();
  const url = new URL(request.url);
  try {
    const created = await createLpRequest(user.id, {
      productName: stringFromForm(form.get("productName")),
      postPlatform: stringFromForm(form.get("postPlatform")),
      domainLpUrl: stringFromForm(form.get("domainLpUrl")),
      style: stringFromForm(form.get("style")),
      angle: stringFromForm(form.get("angle")),
      referenceLinks: parseLinks(form.get("referenceLinks")),
      deadlineAt: new Date(stringFromForm(form.get("deadlineAt"))),
      additionalNotes: stringFromForm(form.get("additionalNotes"))
    });
    return NextResponse.redirect(new URL(`/requests/success?id=${created.id}`, url), { status: 303 });
  } catch (error) {
    return NextResponse.redirect(new URL(`/requests/new/lp?error=${encodeURIComponent((error as Error).message)}`, url), { status: 303 });
  }
}
