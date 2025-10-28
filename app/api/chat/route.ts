import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { recruitmentTools } from "@/lib/tools/recruitment-tools";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: "user" | "assistant";
  content: string | any[];
}

export async function POST(req: NextRequest) {
  try {
    const { messages, agentId, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        systemPrompt: true,
        tools: true,
        config: true,
      },
    });

    if (!agent) {
      return new Response("Agent not found", { status: 404 });
    }

    const enabledToolIds = (agent.tools as string[]) || [];
    const agentTools = recruitmentTools.filter((tool) =>
      enabledToolIds.includes(tool.name)
    );

    console.log("Agent tools enabled:", enabledToolIds);

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let conversationMessages = [...anthropicMessages];
          let shouldContinue = true;

          while (shouldContinue) {
            const messageStream = await anthropic.messages.create({
              model: "claude-sonnet-4-5-20250929",
              max_tokens: (agent.config as any)?.max_tokens || 4096,
              temperature: (agent.config as any)?.temperature || 1.0,
              system: [
                {
                  type: "text",
                  text: agent.systemPrompt,
                  cache_control: { type: "ephemeral" },
                },
              ],
              messages: conversationMessages,
              tools: agentTools.length > 0 ? agentTools : undefined,
              stream: true,
            });

            let fullResponse = "";
            let textContent = "";
            let toolUses: any[] = [];
            let currentToolUse: any = null;
            let currentToolInput = "";

            for await (const event of messageStream) {
              if (event.type === "message_start") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "start" })}\n\n`
                  )
                );
              } else if (event.type === "content_block_start") {
                if (event.content_block.type === "tool_use") {
                  currentToolUse = {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    input: event.content_block.input || {},
                  };
                  currentToolInput = "";
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_use_start",
                        tool_name: currentToolUse.name,
                        tool_id: currentToolUse.id,
                      })}\n\n`
                    )
                  );
                }
              } else if (event.type === "content_block_delta") {
                if (event.delta.type === "text_delta") {
                  const text = event.delta.text;
                  textContent += text;
                  fullResponse += text;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "text",
                        content: text,
                      })}\n\n`
                    )
                  );
                } else if (event.delta.type === "input_json_delta") {
                  if (currentToolUse) {
                    // Accumulate the partial JSON string
                    currentToolInput += event.delta.partial_json;
                  }
                }
              } else if (event.type === "content_block_stop") {
                if (currentToolUse) {
                  // Parse the complete tool input
                  try {
                    currentToolUse.input = currentToolInput
                      ? JSON.parse(currentToolInput)
                      : {};
                  } catch (e) {
                    console.error(
                      "Failed to parse tool input:",
                      currentToolInput,
                      e
                    );
                    currentToolUse.input = {};
                  }
                  toolUses.push(currentToolUse);
                  console.log("Tool use completed:", currentToolUse);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_use_complete",
                        tool_use: currentToolUse,
                      })}\n\n`
                    )
                  );
                  currentToolUse = null;
                  currentToolInput = "";
                }
              } else if (event.type === "message_delta") {
                if (event.delta.stop_reason === "tool_use") {
                  console.log(
                    "Stopped for tool use, will continue with tool results"
                  );
                }
              } else if (event.type === "message_stop") {
                console.log(
                  "Message complete. Text length:",
                  textContent.length,
                  "Tools used:",
                  toolUses.length
                );

                // If tools were used, we need to provide results and continue
                if (toolUses.length > 0) {
                  // Build assistant message with tool uses
                  const assistantContent: any[] = [];

                  if (textContent) {
                    assistantContent.push({
                      type: "text",
                      text: textContent,
                    });
                  }

                  toolUses.forEach((tool) => {
                    assistantContent.push({
                      type: "tool_use",
                      id: tool.id,
                      name: tool.name,
                      input: tool.input,
                    });
                  });

                  conversationMessages.push({
                    role: "assistant",
                    content: assistantContent,
                  });

                  // Add tool results
                  const toolResults: any[] = toolUses.map((tool) => ({
                    type: "tool_result",
                    tool_use_id: tool.id,
                    content: `Tool executed successfully. Please now generate the actual ${
                      tool.name === "generate_job_description"
                        ? "job description"
                        : "SEO content"
                    } based on the user's request. Write the complete, formatted content.`,
                  }));

                  conversationMessages.push({
                    role: "user",
                    content: toolResults,
                  });

                  // Continue the loop to get the actual response
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "continuing" })}\n\n`
                    )
                  );
                } else {
                  // No tools used, we're done
                  shouldContinue = false;
                  fullResponse = textContent;

                  // Save to database
                  if (sessionId && fullResponse) {
                    try {
                      const existingSession =
                        await prisma.chatSession.findUnique({
                          where: { id: sessionId },
                        });

                      if (existingSession) {
                        const currentMessages =
                          (existingSession.messages as any[]) || [];
                        await prisma.chatSession.update({
                          where: { id: sessionId },
                          data: {
                            messages: [
                              ...currentMessages,
                              {
                                role: "assistant",
                                content: fullResponse,
                                timestamp: new Date().toISOString(),
                              },
                            ],
                            updatedAt: new Date(),
                          },
                        });
                      } else {
                        await prisma.chatSession.create({
                          data: {
                            id: sessionId,
                            agentId: agentId,
                            messages: [
                              {
                                role: "assistant",
                                content: fullResponse,
                                timestamp: new Date().toISOString(),
                              },
                            ],
                          },
                        });
                      }
                    } catch (dbError) {
                      console.error("Failed to save message:", dbError);
                    }
                  }

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "done" })}\n\n`
                    )
                  );
                }
              }
            }
          }

          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error.message || "An error occurred",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
