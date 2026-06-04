import { appConfig } from "@/lib/config";

export function isGoogleOAuthConfigured() {
  return Boolean(appConfig.google.clientId && appConfig.google.clientSecret);
}

export function getGoogleAuthorizationUrl(state: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", appConfig.google.clientId);
  url.searchParams.set("redirect_uri", appConfig.google.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  return url.toString();
}

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function fetchGoogleProfile(code: string): Promise<GoogleProfile> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: appConfig.google.clientId,
      client_secret: appConfig.google.clientSecret,
      redirect_uri: appConfig.google.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Google token exchange failed");
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    throw new Error("Google profile request failed");
  }

  return profileResponse.json() as Promise<GoogleProfile>;
}
