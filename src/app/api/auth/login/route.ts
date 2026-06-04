import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { isValidEmail, normalizeString } from "@/lib/http/validation";
import { userService } from "@/modules/users/user.service";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const email = normalizeString(body.email).toLowerCase();
  const password = normalizeString(body.password);

  if (!isValidEmail(email) || password.length < 8) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 422 });
  }

  const user = await userService.authenticateWithEmail(email, password);

  if (!user) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  await setSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
