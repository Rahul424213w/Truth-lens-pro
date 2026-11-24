import { NextResponse } from "next/server";
import { getStats } from "@/lib/storage";

export async function GET() {
  const data = getStats();
  return NextResponse.json({ success: true, data });
}
