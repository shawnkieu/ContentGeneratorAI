"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: string;
}

interface AgentSelectorProps {
  selectedAgentId: string;
  onAgentSelect: (agentId: string) => void;
}

export function AgentSelector({
  selectedAgentId,
  onAgentSelect,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data);

        // Auto-select first agent if none selected
        if (data.length > 0 && !selectedAgentId) {
          onAgentSelect(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="agent-select" className="flex items-center gap-2">
        <Bot className="h-4 w-4" />
        Select AI Agent
      </Label>
      <Select value={selectedAgentId} onValueChange={onAgentSelect}>
        <SelectTrigger id="agent-select" className="w-full">
          <SelectValue placeholder="Choose an agent..." />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{agent.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {agent.type.replace("_", " ")}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {agents.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No agents available. Please create one in the admin panel.
        </p>
      )}
    </div>
  );
}
