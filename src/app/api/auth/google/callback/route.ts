import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchGoogleProfile } from "@/lib/auth/google";
import { setSessionCookie } from "@/lib/auth/session";
import { appConfig } from "@/lib/config";
import { userService } from "@/modules/users/user.service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("ottomob_google_oauth_state")?.value;

  cookieStore.delete("ottomob_google_oauth_state");

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${appConfig.appUrl}/login?error=google_state`);
  }

  try {
    const profile = await fetchGoogleProfile(code);

    if (!profile.email || !profile.email_verified) {
      return NextResponse.redirect(`${appConfig.appUrl}/login?error=google_email`);
    }

    const user = await userService.upsertGoogleUser(profile);
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.redirect(`${appConfig.appUrl}/account`);
  } catch {
    return NextResponse.redirect(`${appConfig.appUrl}/login?error=google_failed`);
  }
}
