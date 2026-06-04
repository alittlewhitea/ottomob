import { NextResponse } from "next/server";

export async function GET() {
  // Reserved for later order query endpoints.
  return NextResponse.json({
    connected: false,
    message: "Order APIs are not enabled in the static homepage phase.",
  });
}
