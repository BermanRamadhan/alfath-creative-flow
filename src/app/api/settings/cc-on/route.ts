import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { setCreatorOn } from "@/lib/workflow";

export async function POST(request: Request) {
  const user = await requireRole(["CC"]);
  const url = new URL(request.url);
  await setCreatorOn(user.id);
  return NextResponse.redirect(new URL("/settings", url), { status: 303 });
}
