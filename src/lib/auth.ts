import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export type UserRole = "admin" | "teacher" | "guest";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
);
const COOKIE_NAME = "chaisodochub_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function createSessionToken(role: UserRole): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<{ role: UserRole } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { role: payload.role as UserRole };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ role: UserRole } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<{ role: UserRole } | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function verifyPasscode(
  passcode: string
): { valid: true; role: UserRole } | { valid: false } {
  if (passcode === process.env.ADMIN_PASSCODE) return { valid: true, role: "admin" };
  if (passcode === process.env.TEACHER_PASSCODE) return { valid: true, role: "teacher" };
  return { valid: false };
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
