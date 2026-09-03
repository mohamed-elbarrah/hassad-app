import { describe, expect, it, vi } from "vitest";
import { AiAssistantArea } from "@hassad/shared";
import { ToolRegistryService } from "./tool-registry.service";
import { BaseTool, ToolResult } from "./tool.interface";

function tool(name: string, category: AiAssistantArea): BaseTool {
  return {
    definition: {
      name,
      description: `${name} description`,
      category,
      parameters: { type: "object", properties: {} },
    },
    execute: vi.fn(
      async (): Promise<ToolResult> => ({
        summary: "ok",
        data: {},
      }),
    ),
  } as BaseTool;
}

describe("ToolRegistryService area enforcement", () => {
  it("exposes and executes only tools in the conversation areas", async () => {
    const registry = new ToolRegistryService();
    const crmTool = tool("crm.lookup", AiAssistantArea.CRM);
    const financeTool = tool("finance.lookup", AiAssistantArea.FINANCE);
    registry.register(crmTool, financeTool);

    expect(
      registry.getDefinitions([AiAssistantArea.CRM]).map((d) => d.name),
    ).toEqual(["crm.lookup"]);
    await expect(
      registry.executeTool("finance.lookup", {}, [AiAssistantArea.CRM]),
    ).rejects.toMatchObject({
      response: {
        code: "AI_TOOL_AREA_NOT_ALLOWED",
        details: { tool: "finance.lookup", area: AiAssistantArea.FINANCE },
      },
    });
    await registry.executeTool("crm.lookup", {}, [AiAssistantArea.CRM]);
    expect(crmTool.execute).toHaveBeenCalledOnce();
  });

  it("allows every registered tool for the ALL area", async () => {
    const registry = new ToolRegistryService();
    const financeTool = tool("finance.lookup", AiAssistantArea.FINANCE);
    registry.register(financeTool);

    await expect(
      registry.executeTool("finance.lookup", { year: 2026 }, [
        AiAssistantArea.ALL,
      ]),
    ).resolves.toEqual({ summary: "ok", data: {} });
  });
});
