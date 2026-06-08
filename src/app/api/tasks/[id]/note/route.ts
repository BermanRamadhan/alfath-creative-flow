import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stringFromForm } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const form = await request.formData();
  const url = new URL(request.url);
  const note = stringFromForm(form.get("note"));
  if (note) {
    await db.taskNote.create({
      data: {
        requestId: params.id,
        userId: user.id,
        noteType: stringFromForm(form.get("noteType")) || "GENERAL",
        note
      }
    });
  }
  return NextResponse.redirect(new URL(`/tasks/${params.id}`, url), { status: 303 });
}
