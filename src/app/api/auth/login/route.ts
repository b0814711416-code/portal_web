import { NextRequest, NextResponse } from "next/server";
import {
  verifyPasscode,
  createSessionToken,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();
  if (!passcode) {
    return NextResponse.json({ error: "กรุณากรอกรหัสผ่าน" }, { status: 400 });
  }

  const result = verifyPasscode(String(passcode));
  if (!result.valid) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const token = await createSessionToken(result.role);
  const res = NextResponse.json({ role: result.role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
