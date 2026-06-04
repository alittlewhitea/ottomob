import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getGoogleAuthorizationUrl, isGoogleOAuthConfigured } from "@/lib/auth/google";
import { appConfig } from "@/lib/config";

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(`${appConfig.appUrl}/login?error=google_not_configured`);
  }

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("ottomob_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(getGoogleAuthorizationUrl(state));
}
