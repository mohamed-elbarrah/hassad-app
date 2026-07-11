import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  IsUrl,
  IsBoolean,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

// ── Legacy Brand Assets ───────────────────────────────────────────────────────

class BrandAssetsDto {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString({ each: true })
  brandColors?: string[];

  @IsOptional()
  @IsString({ each: true })
  fonts?: string[];

  @IsOptional()
  @IsUrl()
  guidelinesUrl?: string;
}

// ── V2: Communication Info (Step 1) ────────────────────────────────────────────

export class CommunicationInfoDto {
  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

// ── V2: Product Info (Step 2) ──────────────────────────────────────────────────

export class ProductInfoDto {
  @IsOptional()
  @IsString()
  productStory?: string;

  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @IsOptional()
  @IsString()
  valueProposition?: string;

  @IsOptional()
  @IsString()
  advantages?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsString()
  contentDirection?: string;
}

// ── V2: Audience Info (Step 3a) ────────────────────────────────────────────────

class FaqPairDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  answer?: string;
}

export class AudienceInfoDto {
  @IsOptional()
  @IsString()
  customerAnalysis?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqPairDto)
  faq?: FaqPairDto[];
}

// ── V2: Brand Voice (Step 3b) ──────────────────────────────────────────────────

export class BrandVoiceDto {
  @IsOptional()
  @IsString()
  toneOfVoice?: string;

  @IsOptional()
  @IsString()
  boundaries?: string;

  @IsOptional()
  @IsString()
  verbalSlogan?: string;

  @IsOptional()
  @IsString()
  appearanceMethod?: string;
}

// ── V2: Customer Journey (Step 4) ──────────────────────────────────────────────

export class CustomerJourneyDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderMethods?: string[];

  @IsOptional()
  @IsString()
  followUpTools?: string;
}

// ── V2: Campaign Info (Step 5) ─────────────────────────────────────────────────

export class CampaignInfoDto {
  @IsOptional()
  @IsString()
  campaignGoal?: string;

  @IsOptional()
  @IsString()
  campaignDetails?: string;

  @IsOptional()
  @IsString()
  campaignOffer?: string;

  @IsOptional()
  @IsString()
  guarantees?: string;

  @IsOptional()
  @IsString()
  campaignSeason?: string;

  @IsOptional()
  @IsString()
  competitors?: string;
}

// ── V2: Past Performance (Step 6a) ────────────────────────────────────────────

export class PastPerformanceDto {
  @IsOptional()
  @IsString()
  bestCampaigns?: string;

  @IsOptional()
  @IsString()
  pastPerformance?: string;

  @IsOptional()
  @IsString()
  trackingSetup?: string;
}

// ── V2: Budget Info (Step 6b) ─────────────────────────────────────────────────

export class BudgetInfoDto {
  @IsOptional()
  @IsNumber()
  budgetRange?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previousReports?: string[];
}

// ── V2: Visual Identity Info (Step 7) ──────────────────────────────────────────

class VisualIdentityBrandAssetsDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandColors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fonts?: string[];

  @IsOptional()
  @IsString()
  guidelinesUrl?: string;
}

export class VisualIdentityInfoDto {
  @IsOptional()
  @IsBoolean()
  hasVisualIdentity?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => VisualIdentityBrandAssetsDto)
  brandAssets?: VisualIdentityBrandAssetsDto;

  @IsOptional()
  @IsString()
  pastDesigns?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productPhotos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visualDirection?: string[];
}

// ── Legacy DTO (kept for backward compatibility) ───────────────────────────────

export class UpsertClientProfileDto {
  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  budgetRangeMin?: number;

  @IsOptional()
  @IsNumber()
  budgetRangeMax?: number;

  @IsOptional()
  @IsString()
  communicationPreference?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  preferredPlatforms?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandAssetsDto)
  brandAssets?: BrandAssetsDto;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  instagramHandle?: string;

  @IsOptional()
  @IsString()
  tiktokHandle?: string;

  @IsOptional()
  @IsString()
  twitterHandle?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  snapchatHandle?: string;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  @IsString()
  decisionMakerName?: string;

  @IsOptional()
  @IsString()
  decisionMakerPhone?: string;

  @IsOptional()
  @IsString()
  painPoints?: string;
}

// ── V2 DTO (unified with IntakeFormV2) ─────────────────────────────────────────

export class UpsertClientProfileV2Dto {
  // V2: Step 1 - Communication
  @IsOptional()
  @ValidateNested()
  @Type(() => CommunicationInfoDto)
  communicationInfo?: CommunicationInfoDto;

  // V2: Step 2 - Product Info
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductInfoDto)
  productInfo?: ProductInfoDto;

  // V2: Step 3 - Audience & Brand Voice
  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceInfoDto)
  audienceInfo?: AudienceInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandVoiceDto)
  brandVoice?: BrandVoiceDto;

  // V2: Step 4 - Customer Journey
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerJourneyDto)
  customerJourney?: CustomerJourneyDto;

  // V2: Step 5 - Campaign Info
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignInfoDto)
  campaignInfo?: CampaignInfoDto;

  // V2: Step 6 - Performance & Budget
  @IsOptional()
  @ValidateNested()
  @Type(() => PastPerformanceDto)
  pastPerformance?: PastPerformanceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetInfoDto)
  budgetInfo?: BudgetInfoDto;

  // V2: Step 7 - Visual Identity
  @IsOptional()
  @ValidateNested()
  @Type(() => VisualIdentityInfoDto)
  visualIdentityInfo?: VisualIdentityInfoDto;
}
