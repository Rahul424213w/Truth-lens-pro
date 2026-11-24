import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const data = getHistory(type);
  return NextResponse.json({ success: true, data });
}
