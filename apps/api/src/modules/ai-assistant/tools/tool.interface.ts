import { AiAssistantArea } from "@hassad/shared";

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: { type: string };
  properties?: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: AiAssistantArea;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export interface ToolResult {
  summary: string;
  data: Record<string, unknown>;
}

export abstract class BaseTool {
  abstract definition: ToolDefinition;
  abstract execute(args?: Record<string, unknown>): Promise<ToolResult>;
}
