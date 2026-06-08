import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { updateBankStatus } from "@/lib/workflow";
import { stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  await requireRole(["ADMIN", "ADVERTISER"]);
  const form = await request.formData();
  const url = new URL(request.url);
  await updateBankStatus(params.id, stringFromForm(form.get("testStatus")));
  return NextResponse.redirect(new URL(`/bank-konten/${params.id}`, url), { status: 303 });
}
