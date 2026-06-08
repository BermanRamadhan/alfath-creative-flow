import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const url = new URL(request.url);

  const user = await db.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL("/login?error=Login gagal", url), { status: 303 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(new URL("/login?error=Login gagal", url), { status: 303 });
  }

  const session = await createSession(user.id);
  const response = NextResponse.redirect(new URL("/dashboard", url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    expires: session.expiresAt,
    path: "/"
  });
  return response;
}
