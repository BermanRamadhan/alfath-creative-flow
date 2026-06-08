import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const url = new URL(request.url);
  const draft = await db.requestDraft.findUnique({ where: { id: params.id } });
  if (!draft || (user.role !== "ADMIN" && draft.requesterId !== user.id)) {
    return NextResponse.redirect(new URL("/forbidden", url), { status: 303 });
  }
  await db.requestDraft.delete({ where: { id: params.id } });
  return NextResponse.redirect(new URL("/requests/drafts", url), { status: 303 });
}
