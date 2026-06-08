import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { deletePendingRequest } from "@/lib/workflow";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const url = new URL(request.url);

  try {
    await deletePendingRequest(user.id, user.role === "ADMIN", params.id);
    return NextResponse.redirect(new URL("/tasks", url), { status: 303 });
  } catch (error) {
    return NextResponse.redirect(new URL(`/requests/${params.id}/edit?error=${encodeURIComponent((error as Error).message)}`, url), { status: 303 });
  }
}
