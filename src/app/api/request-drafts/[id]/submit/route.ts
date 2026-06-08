import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { submitDraft } from "@/lib/request-drafts";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const url = new URL(request.url);
  try {
    const created = await submitDraft(params.id, user.id, user.role === "ADMIN");
    return NextResponse.redirect(new URL(`/requests/success?id=${created.id}`, url), { status: 303 });
  } catch (error) {
    return NextResponse.redirect(new URL(`/requests/drafts/${params.id}?error=${encodeURIComponent((error as Error).message)}`, url), { status: 303 });
  }
}
