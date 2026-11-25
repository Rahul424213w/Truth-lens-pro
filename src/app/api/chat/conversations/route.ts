import { NextRequest, NextResponse } from "next/server";
import {
  getConversations,
  getConversation,
  saveConversation,
  deleteConversation,
  clearAllConversations,
  ChatConversation,
} from "@/lib/storage";
import { getErrorMessage } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const conv = getConversation(id);
      if (!conv) {
        return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: conv });
    }

    const conversations = getConversations();
    // Return sorted by updatedAt descending
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ success: true, data: sorted });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(err, "Failed to get conversations") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const newConv: ChatConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: body.title || "New Fact-Check Session",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    saveConversation(newConv);
    return NextResponse.json({ success: true, data: newConv });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(err, "Failed to create conversation") }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || id === "all") {
      clearAllConversations();
      return NextResponse.json({ success: true, message: "All conversations cleared" });
    }

    const deleted = deleteConversation(id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(err, "Failed to delete conversation") }, { status: 500 });
  }
}
