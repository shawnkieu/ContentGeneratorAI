"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, Square, Bot, User } from "lucide-react";
import { useState } from "react";
import { MarkdownContent } from "@/components/chat/markdown-content";

interface ChatInterfaceProps {
  agentId: string;
  sessionId: string;
}

export function ChatInterface({ agentId, sessionId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, streamingMessage, sendMessage, stopGeneration } =
    useChat({
      agentId,
      sessionId,
      onError: (error) => {
        console.error("Chat error:", error);
      },
    });

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto border border-gray-300 ">
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.length === 0 && !streamingMessage && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Start a Conversation
              </h3>
              <p className="text-muted-foreground text-sm">
                Ask me to generate a job description or create SEO content
              </p>
              <div className="mt-6 space-y-2 max-w-md mx-auto">
                <Card
                  className="p-3 text-sm text-left hover:bg-accent cursor-pointer transition-colors"
                  onClick={() =>
                    setInput(
                      "Create a job description for a Senior React Developer"
                    )
                  }
                >
                  <p className="font-medium">Example: Job Description</p>
                  <p className="text-muted-foreground">
                    "Create a job description for a Senior React Developer"
                  </p>
                </Card>
                <Card
                  className="p-3 text-sm text-left hover:bg-accent cursor-pointer transition-colors"
                  onClick={() =>
                    setInput(
                      "Generate SEO content for a tech recruitment landing page targeting 'software engineer jobs'"
                    )
                  }
                >
                  <p className="font-medium">Example: SEO Content</p>
                  <p className="text-muted-foreground">
                    "Generate SEO content for a tech recruitment landing page"
                  </p>
                </Card>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                ) : (
                  <div className="text-sm">
                    <MarkdownContent content={message.content} />
                  </div>
                )}
                {message.toolUse && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs opacity-70">
                      🔧 Used tool:{" "}
                      <span className="font-medium">
                        {message.toolUse.name}
                      </span>
                    </p>
                  </div>
                )}
              </Card>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {streamingMessage && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>

              <Card className="max-w-[80%] p-4 bg-muted">
                <div className="text-sm">
                  <MarkdownContent content={streamingMessage} />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={stopGeneration}
                className="h-[60px] w-[60px]"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="h-[60px] w-[60px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
