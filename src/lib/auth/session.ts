import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { appConfig } from "@/lib/config";

export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
};

const encoder = new TextEncoder();

function getSecret() {
  return encoder.encode(appConfig.auth.jwtSecret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(appConfig.auth.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(appConfig.auth.cookieName);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(appConfig.auth.cookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: Number(payload.id),
      email: String(payload.email),
      name: typeof payload.name === "string" ? payload.name : null,
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}
