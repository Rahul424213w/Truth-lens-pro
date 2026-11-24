import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, email and password required" }, { status: 400 });
    }
    const user = {
      id: "u-" + Date.now(),
      name,
      email: email.toLowerCase(),
      analysisCount: 0,
    };
    return NextResponse.json({
      success: true,
      token: "demo-jwt-token-" + Date.now(),
      user,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
