import "server-only";

import { db } from "@/lib/db";
import { createContentRequest, createLpRequest } from "@/lib/workflow";
import { deserializeLinks, numberFromForm, parseLinks, serializeLinks, stringFromForm } from "@/lib/utils";

function optionalDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function draftDataFromForm(form: FormData) {
  const requestType = stringFromForm(form.get("requestType")) === "LP" ? "LP" : "CONTENT";
  return {
    requestType,
    productName: stringFromForm(form.get("productName")) || null,
    postPlatform: stringFromForm(form.get("postPlatform")) || null,
    style: stringFromForm(form.get("style")) || null,
    angle: stringFromForm(form.get("angle")) || null,
    hook: stringFromForm(form.get("hook")) || null,
    domainLpUrl: stringFromForm(form.get("domainLpUrl")) || null,
    referenceLinks: serializeLinks(parseLinks(form.get("referenceLinks"))),
    rawOrReferenceLinks: serializeLinks(parseLinks(form.get("rawOrReferenceLinks"))),
    videoAmount: numberFromForm(form.get("videoAmount")),
    imageAmount: numberFromForm(form.get("imageAmount")),
    useFrame: stringFromForm(form.get("useFrame")) || null,
    deadlineAt: optionalDate(stringFromForm(form.get("deadlineAt"))),
    additionalNotes: stringFromForm(form.get("additionalNotes")) || null
  };
}

export async function submitDraft(draftId: string, userId: string, isAdmin: boolean) {
  const draft = await db.requestDraft.findUnique({ where: { id: draftId } });
  if (!draft) throw new Error("Draft tidak ditemukan.");
  if (!isAdmin && draft.requesterId !== userId) {
    throw new Error("Kamu tidak punya akses ke draft ini.");
  }
  const requesterId = draft.requesterId;

  const created =
    draft.requestType === "LP"
      ? await createLpRequest(requesterId, {
          productName: draft.productName ?? "",
          postPlatform: draft.postPlatform ?? "",
          domainLpUrl: draft.domainLpUrl ?? "",
          style: draft.style ?? "",
          angle: draft.angle,
          referenceLinks: deserializeLinks(draft.referenceLinks),
          deadlineAt: draft.deadlineAt ?? new Date(""),
          additionalNotes: draft.additionalNotes
        })
      : await createContentRequest(requesterId, {
          productName: draft.productName ?? "",
          videoAmount: draft.videoAmount,
          imageAmount: draft.imageAmount,
          useFrame: draft.useFrame ?? "",
          postPlatform: draft.postPlatform ?? "",
          rawOrReferenceLinks: deserializeLinks(draft.rawOrReferenceLinks),
          angle: draft.angle,
          hook: draft.hook,
          deadlineAt: draft.deadlineAt ?? new Date(""),
          additionalNotes: draft.additionalNotes
        });

  await db.requestDraft.delete({ where: { id: draftId } });
  return created;
}
