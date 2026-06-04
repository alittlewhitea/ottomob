import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { isValidEmail, normalizeString } from "@/lib/http/validation";
import { userService } from "@/modules/users/user.service";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const email = normalizeString(body.email).toLowerCase();
  const name = normalizeString(body.name);
  const password = normalizeString(body.password);

  if (!isValidEmail(email) || name.length < 2 || password.length < 8) {
    return NextResponse.json(
      { message: "Please provide a valid email, name, and password with at least 8 characters." },
      { status: 422 },
    );
  }

  try {
    const user = await userService.registerWithEmail({ email, name, password });
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") {
      return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
    }

    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
