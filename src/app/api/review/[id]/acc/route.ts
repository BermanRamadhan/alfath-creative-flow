import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { accTask } from "@/lib/workflow";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const url = new URL(request.url);
  await accTask(user.id, params.id);
  const notifyUrl = new URL("/notifications/whatsapp", url);
  notifyUrl.searchParams.set("event", "acc_completed");
  notifyUrl.searchParams.set("task", params.id);
  notifyUrl.searchParams.set("next", `/bank-konten?task=${params.id}`);
  return NextResponse.redirect(notifyUrl, { status: 303 });
}
