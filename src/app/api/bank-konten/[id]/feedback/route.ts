import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createFeedback } from "@/lib/workflow";
import { parseJakartaDateInput, stringFromForm } from "@/lib/utils";

function optionalNumber(form: FormData, key: string) {
  const raw = stringFromForm(form.get(key));
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const form = await request.formData();
  const url = new URL(request.url);
  const dateRaw = stringFromForm(form.get("testDate"));
  await createFeedback(user.id, params.id, {
    testStatus: stringFromForm(form.get("testStatus")),
    testedPlatform: stringFromForm(form.get("testedPlatform")),
    testDate: dateRaw ? parseJakartaDateInput(dateRaw) : null,
    testResult: stringFromForm(form.get("testResult")),
    score1: optionalNumber(form, "score1"),
    score2: optionalNumber(form, "score2"),
    score3: optionalNumber(form, "score3"),
    score4: optionalNumber(form, "score4"),
    score5: optionalNumber(form, "score5"),
    spend: optionalNumber(form, "spend"),
    roas: optionalNumber(form, "roas"),
    sales: optionalNumber(form, "sales"),
    profit: optionalNumber(form, "profit"),
    feedbackNote: stringFromForm(form.get("feedbackNote")),
    suggestionForCreator: stringFromForm(form.get("suggestionForCreator"))
  });
  return NextResponse.redirect(new URL(`/bank-konten/${params.id}`, url), { status: 303 });
}
