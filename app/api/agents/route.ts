import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        enabled: true,
        parentId: null, // Only get top-level agents
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
