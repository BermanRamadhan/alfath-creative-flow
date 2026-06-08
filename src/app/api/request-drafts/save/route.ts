import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { draftDataFromForm } from "@/lib/request-drafts";
import { stringFromForm } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const form = await request.formData();
  const url = new URL(request.url);
  const draftId = stringFromForm(form.get("draftId"));
  const data = draftDataFromForm(form);

  if (draftId) {
    const draft = await db.requestDraft.findUnique({ where: { id: draftId } });
    if (!draft || (user.role !== "ADMIN" && draft.requesterId !== user.id)) {
      return NextResponse.redirect(new URL("/forbidden", url), { status: 303 });
    }
    await db.requestDraft.update({
      where: { id: draftId },
      data
    });
    return NextResponse.redirect(new URL(`/requests/drafts/${draftId}?saved=1`, url), { status: 303 });
  }

  const created = await db.requestDraft.create({
    data: {
      ...data,
      requesterId: user.id
    }
  });
  return NextResponse.redirect(new URL(`/requests/drafts/${created.id}?saved=1`, url), { status: 303 });
}
