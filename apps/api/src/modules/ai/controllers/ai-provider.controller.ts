import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from "@nestjs/common";
import { AiProviderService } from "../services/ai-provider.service";
import { AiProviderRegistry } from "../services/ai-provider-registry.service";
import { CreateAiProviderDto, UpdateAiProviderDto } from "../dto/ai-provider.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/ai/providers")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiProviderController {
  constructor(
    private readonly service: AiProviderService,
    private readonly registry: AiProviderRegistry,
  ) {}

  @Get()
  @RequirePermissions("admin.ai.read")
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  @RequirePermissions("admin.ai.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("admin.ai.manage")
  create(@Body() dto: CreateAiProviderDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("admin.ai.manage")
  update(@Param("id") id: string, @Body() dto: UpdateAiProviderDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("admin.ai.manage")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post(":id/test")
  @RequirePermissions("admin.ai.manage")
  async test(@Param("id") id: string) {
    const provider = this.registry.getPrimary();
    if (!provider) {
      return { success: false, message: "No active provider found" };
    }
    try {
      const result = await provider.generateText("Respond with only the word: OK");
      return { success: true, model: result.model, response: result.text };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Unknown error" };
    }
  }
}
