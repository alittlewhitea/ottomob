import { NextResponse } from "next/server";
import { catalogService } from "@/modules/services/catalog.service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") ?? undefined;
  const services = await catalogService.listByPlatform(platform);

  return NextResponse.json({ services });
}
