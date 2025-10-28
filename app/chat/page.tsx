"use client";

import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { AgentSelector } from "@/components/chat/agent-selector";
import { Card } from "@/components/ui/card";

export default function ChatPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Create a new session ID when component mounts
    const newSessionId = `session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    // Create new session when agent changes
    const newSessionId = `session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);
  };

  return (
    <div className="container mx-auto h-screen flex flex-col p-4 max-w-6xl">
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">Recruitment AI Assistant</h1>
        <p className="text-muted-foreground">
          Generate job descriptions and SEO content powered by Claude
        </p>
      </div>

      <Card className="mb-4 p-4">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onAgentSelect={handleAgentChange}
        />
      </Card>

      <div className="flex-1 overflow-hidden">
        {selectedAgentId && sessionId ? (
          <ChatInterface
            key={sessionId} // Force remount on new session
            agentId={selectedAgentId}
            sessionId={sessionId}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Please select an agent to start chatting
              </p>
              <p className="text-sm text-muted-foreground">
                Choose between Job Description Generator or SEO Content Creator
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
