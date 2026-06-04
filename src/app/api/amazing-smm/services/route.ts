import { NextResponse } from "next/server";

export async function GET() {
  // Reserved for phase 2. This route will call amazingSmmApi.listServices()
  // and optionally cache normalized services in MySQL.
  return NextResponse.json({
    connected: false,
    message: "AmazingSMM service sync is reserved for a later phase.",
  });
}
