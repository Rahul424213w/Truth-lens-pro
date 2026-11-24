import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }
    const name = email.split("@")[0] || "User";
    const user = {
      id: "u-" + Date.now(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: email.toLowerCase(),
      analysisCount: 4,
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
