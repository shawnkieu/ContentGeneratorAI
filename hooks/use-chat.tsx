import { useState, useCallback, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolUse?: {
    name: string;
    input: any;
  };
}

interface UseChatOptions {
  agentId: string;
  sessionId?: string;
  onError?: (error: Error) => void;
}

export function useChat({ agentId, sessionId, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingMessage("");

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        // Save user message to database if sessionId exists
        if (sessionId) {
          try {
            await fetch("/api/sessions/save-message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                agentId,
                message: {
                  role: "user",
                  content,
                  timestamp: new Date().toISOString(),
                },
              }),
            });
          } catch (error) {
            console.error("Failed to save user message:", error);
          }
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            agentId,
            sessionId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let accumulatedContent = "";
        let currentToolUse: any = null;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));

              if (data.type === "text") {
                accumulatedContent += data.content;
                setStreamingMessage(accumulatedContent);
              } else if (data.type === "tool_use_start") {
                currentToolUse = {
                  name: data.tool_name,
                  id: data.tool_id,
                };
                // Don't show tool usage message, just continue
              } else if (data.type === "tool_use_complete") {
                currentToolUse = {
                  ...currentToolUse,
                  input: data.tool_use.input,
                };
              } else if (data.type === "continuing") {
                // Tool results provided, Claude will continue generating
                setStreamingMessage((prev) => prev + "\n\n");
              } else if (data.type === "done") {
                const assistantMessage: Message = {
                  id: `assistant-${Date.now()}`,
                  role: "assistant",
                  content: accumulatedContent,
                  timestamp: new Date(),
                  toolUse: currentToolUse,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingMessage("");
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Request aborted");
        } else {
          console.error("Chat error:", error);
          onError?.(error);

          // Add error message
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `Sorry, an error occurred: ${error.message}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setIsLoading(false);
        setStreamingMessage("");
        abortControllerRef.current = null;
      }
    },
    [messages, agentId, sessionId, isLoading, onError]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage("");
  }, []);

  return {
    messages,
    isLoading,
    streamingMessage,
    sendMessage,
    stopGeneration,
    clearMessages,
  };
}
