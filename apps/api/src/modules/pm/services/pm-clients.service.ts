import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";
import { ClientProfileService } from "../../crm/services/client-profile.service";

const PM_VISIBLE_COMMUNICATION_FIELDS = [
  "businessName",
  "businessType",
  "industry",
] as const;
const PM_VISIBLE_PROFILE_FIELDS = {
  productInfo: [
    "productStory",
    "detailedDescription",
    "valueProposition",
    "advantages",
    "benefits",
    "contentDirection",
  ],
  brandVoice: [
    "toneOfVoice",
    "boundaries",
    "verbalSlogan",
    "appearanceMethod",
  ],
  customerJourney: ["orderMethods", "followUpTools"],
  campaignInfo: [
    "campaignGoal",
    "campaignDetails",
    "campaignOffer",
    "guarantees",
    "campaignSeason",
    "competitors",
  ],
  visualIdentityInfo: [
    "hasVisualIdentity",
    "brandAssets",
    "pastDesigns",
    "productPhotos",
    "visualDirection",
  ],
} as const;

function selectRecordFields(
  value: unknown,
  fields: readonly string[],
): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const selected = Object.fromEntries(
    fields
      .filter((field) => record[field] !== undefined)
      .map((field) => [field, record[field]]),
  );

  return Object.keys(selected).length > 0 ? selected : null;
}

function selectAudienceInfo(value: unknown) {
  const audienceInfo = selectRecordFields(value, ["customerAnalysis", "faq"]);
  if (!audienceInfo || !Array.isArray(audienceInfo.faq)) return audienceInfo;

  audienceInfo.faq = audienceInfo.faq
    .map((item) => selectRecordFields(item, ["question", "answer"]))
    .filter((item): item is Record<string, unknown> => item !== null);
  return audienceInfo;
}

function selectVisualIdentityInfo(value: unknown) {
  const visualIdentityInfo = selectRecordFields(
    value,
    PM_VISIBLE_PROFILE_FIELDS.visualIdentityInfo,
  );
  if (visualIdentityInfo && "brandAssets" in visualIdentityInfo) {
    visualIdentityInfo.brandAssets = selectRecordFields(
      visualIdentityInfo.brandAssets,
      ["logoUrl", "brandColors", "fonts", "guidelinesUrl"],
    );
  }
  return visualIdentityInfo;
}

@Injectable()
export class PmClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientProfileService: ClientProfileService,
  ) {}

  private async assertOwnership(clientId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { clientId, projectManagerId: userId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { clientId },
      });
    }
  }

  private async getPmTeamView(clientId: string, userId: string) {
    await this.assertOwnership(clientId, userId);
    const teamView = await this.clientProfileService.getTeamView(clientId);
    const { client, profile } = teamView;

    return {
      client: {
        id: client.id,
        companyName: client.companyName,
        businessName: client.businessName,
        businessType: client.businessType,
        kind: client.kind,
        status: client.status,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        manager: client.manager
          ? { id: client.manager.id, name: client.manager.name }
          : null,
      },
      profile: profile
        ? {
            id: profile.id,
            clientId: profile.clientId,
            communicationInfo: selectRecordFields(
              profile.communicationInfo,
              PM_VISIBLE_COMMUNICATION_FIELDS,
            ),
            productInfo: selectRecordFields(
              profile.productInfo,
              PM_VISIBLE_PROFILE_FIELDS.productInfo,
            ),
            audienceInfo: selectAudienceInfo(profile.audienceInfo),
            brandVoice: selectRecordFields(
              profile.brandVoice,
              PM_VISIBLE_PROFILE_FIELDS.brandVoice,
            ),
            customerJourney: selectRecordFields(
              profile.customerJourney,
              PM_VISIBLE_PROFILE_FIELDS.customerJourney,
            ),
            campaignInfo: selectRecordFields(
              profile.campaignInfo,
              PM_VISIBLE_PROFILE_FIELDS.campaignInfo,
            ),
            visualIdentityInfo: selectVisualIdentityInfo(
              profile.visualIdentityInfo,
            ),
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
    };
  }

  getFull(clientId: string, userId: string) {
    return this.getPmTeamView(clientId, userId);
  }

  getTeamView(clientId: string, userId: string) {
    return this.getPmTeamView(clientId, userId);
  }
}
