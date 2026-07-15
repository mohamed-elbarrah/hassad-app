import { Injectable, Logger } from "@nestjs/common";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private tools = new Map<string, BaseTool>();

  register(...tools: BaseTool[]) {
    for (const tool of tools) {
      if (this.tools.has(tool.definition.name)) {
        this.logger.warn(`Tool "${tool.definition.name}" already registered`);
      }
      this.tools.set(tool.definition.name, tool);
    }
    this.logger.log(`Registered ${tools.length} tool(s) — total: ${this.tools.size}`);
  }

  getDefinitions(areas: AiAssistantArea[]): ToolDefinition[] {
    const isAll = areas.includes(AiAssistantArea.ALL);
    const defs: ToolDefinition[] = [];
    for (const tool of this.tools.values()) {
      if (isAll || areas.includes(tool.definition.category)) {
        defs.push(tool.definition);
      }
    }
    return defs;
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    return tool.execute(args);
  }
}
