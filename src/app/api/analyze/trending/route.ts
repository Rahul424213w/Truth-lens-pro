import { NextResponse } from "next/server";
import { TRENDING_CHECKS } from "@/lib/storage";

export async function GET() {
  return NextResponse.json({ success: true, data: TRENDING_CHECKS });
}
