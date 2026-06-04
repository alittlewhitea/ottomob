import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { catalogService } from "@/modules/services/catalog.service";

export async function POST(request: Request) {
  const secret = request.headers.get("x-sync-secret");

  if (!appConfig.amazingSmm.syncSecret || secret !== appConfig.amazingSmm.syncSecret) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await catalogService.syncFromAmazingSmm();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "Service sync failed." }, { status: 500 });
  }
}
