import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, agentId, message } = await req.json();

    if (!sessionId || !agentId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (existingSession) {
      // Append message to existing session
      const currentMessages = (existingSession.messages as any[]) || [];
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          messages: [...currentMessages, message],
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new session with this message
      await prisma.chatSession.create({
        data: {
          id: sessionId,
          agentId: agentId,
          messages: [message],
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
