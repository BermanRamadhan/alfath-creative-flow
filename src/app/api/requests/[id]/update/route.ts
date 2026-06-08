import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updatePendingContentRequest, updatePendingLpRequest } from "@/lib/workflow";
import { numberFromForm, parseLinks, stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const form = await request.formData();
  const url = new URL(request.url);

  try {
    const current = await db.workRequest.findUnique({
      where: { id: params.id },
      select: { requestType: true }
    });
    if (!current) throw new Error("Request tidak ditemukan.");

    if (current.requestType === "LP") {
      await updatePendingLpRequest(user.id, user.role === "ADMIN", params.id, {
        productName: stringFromForm(form.get("productName")),
        postPlatform: stringFromForm(form.get("postPlatform")),
        domainLpUrl: stringFromForm(form.get("domainLpUrl")),
        style: stringFromForm(form.get("style")),
        angle: stringFromForm(form.get("angle")),
        referenceLinks: parseLinks(form.get("referenceLinks")),
        deadlineAt: new Date(stringFromForm(form.get("deadlineAt"))),
        additionalNotes: stringFromForm(form.get("additionalNotes"))
      });
    } else {
      await updatePendingContentRequest(user.id, user.role === "ADMIN", params.id, {
        productName: stringFromForm(form.get("productName")),
        videoAmount: numberFromForm(form.get("videoAmount")),
        imageAmount: numberFromForm(form.get("imageAmount")),
        useFrame: stringFromForm(form.get("useFrame")),
        postPlatform: stringFromForm(form.get("postPlatform")),
        rawOrReferenceLinks: parseLinks(form.get("rawOrReferenceLinks")),
        angle: stringFromForm(form.get("angle")),
        hook: stringFromForm(form.get("hook")),
        deadlineAt: new Date(stringFromForm(form.get("deadlineAt"))),
        additionalNotes: stringFromForm(form.get("additionalNotes"))
      });
    }

    return NextResponse.redirect(new URL(`/tasks/${params.id}`, url), { status: 303 });
  } catch (error) {
    return NextResponse.redirect(new URL(`/requests/${params.id}/edit?error=${encodeURIComponent((error as Error).message)}`, url), { status: 303 });
  }
}
