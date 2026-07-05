/**
 * ClientBriefV2 - Role-aware profile view
 *
 * Renders a client's profile with role-based visibility. Each role sees
 * only the sidebar fields, KPIs, and profile sections relevant to them.
 * Visibility rules are defined centrally in `profile-visibility.ts`.
 *
 * Architecture:
 * - useClientBrief transforms raw Client + ClientProfile into a ViewModel.
 * - IdentitySidebar renders the client's core identity in a sticky sidebar.
 * - KpiGrid renders system-generated KPIs at the top of the main area.
 * - ProfileSections render user-editable profile data in a responsive grid.
 *
 * RTL is handled by the root layout and PortalLayout; no dir attributes are
 * repeated inside this component.
 */

"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { UserRole } from "@hassad/shared";
import { IdentitySidebar } from "./IdentitySidebar";
import { KpiGrid } from "./KpiGrid";
import { EmptySection } from "./EmptySection";
import { useClientBrief, type ClientBriefUser } from "./useClientBrief";
import {
  PROFILE_SECTION_VISIBILITY,
  type ProfileSectionKey,
} from "./profile-visibility";
import {
  PersonalInfoSection,
  ProductSection,
  AudienceSection,
  JourneySection,
  CampaignSection,
  PerformanceSection,
  VisualSection,
} from "@/components/shared/ProfileSections";

interface ClientBriefV2Props {
  client: Client;
  profile: ClientProfile | null;
  /**
   * Pass the authenticated `User` in portal contexts so personal identity
   * fields are read from `User` (single source of truth) instead of
   * `Client`. Omit for CRM / dashboard contexts where `Client` fields
   * are the authoritative business-contact source.
   */
  user?: ClientBriefUser | null;
  /** The role of the viewer — determines what fields/sections are visible */
  role?: UserRole;
}

/** Map each ProfileSectionKey to its render function */
const SECTION_RENDERERS: Record<
  ProfileSectionKey,
  (viewProfile: NonNullable<ClientBriefV2Props["profile"]>) => React.ReactNode
> = {
  personalInfo: () => <PersonalInfoSection mode="view" />,

  product: (viewProfile) => (
    <ProductSection
      mode="view"
      initialData={viewProfile.productInfo ?? undefined}
    />
  ),

  audience: (viewProfile) => {
    const hasData = viewProfile.audienceInfo || viewProfile.brandVoice;
    if (!hasData) return null;
    return (
      <AudienceSection
        mode="view"
        initialData={{
          customerAnalysis: viewProfile.audienceInfo?.customerAnalysis,
          faq: viewProfile.audienceInfo?.faq,
          toneOfVoice: viewProfile.brandVoice?.toneOfVoice,
          boundaries: viewProfile.brandVoice?.boundaries,
          verbalSlogan: viewProfile.brandVoice?.verbalSlogan,
          appearanceMethod: viewProfile.brandVoice?.appearanceMethod,
        }}
      />
    );
  },

  journey: (viewProfile) => {
    if (!viewProfile.customerJourney) return null;
    return (
      <JourneySection
        mode="view"
        initialData={viewProfile.customerJourney ?? undefined}
      />
    );
  },

  campaign: (viewProfile) => {
    if (!viewProfile.campaignInfo) return null;
    return (
      <CampaignSection
        mode="view"
        initialData={viewProfile.campaignInfo ?? undefined}
      />
    );
  },

  performance: (viewProfile) => {
    const hasData = viewProfile.pastPerformance || viewProfile.budgetInfo;
    if (!hasData) return null;
    return (
      <PerformanceSection
        mode="view"
        initialData={{
          pastPerformance: viewProfile.pastPerformance ?? undefined,
          budgetInfo: viewProfile.budgetInfo ?? undefined,
        }}
      />
    );
  },

  visual: (viewProfile) => (
    <VisualSection
      mode="view"
      initialData={{
        hasVisualIdentity: viewProfile.visualIdentityInfo?.hasVisualIdentity,
        pastDesigns: viewProfile.visualIdentityInfo?.pastDesigns,
        visualDirection: viewProfile.visualIdentityInfo?.visualDirection,
        brandAssets: viewProfile.visualIdentityInfo?.brandAssets,
        productPhotos: viewProfile.visualIdentityInfo?.productPhotos,
      }}
    />
  ),
};

export function ClientBriefV2({
  client,
  profile,
  user = null,
  role = UserRole.ADMIN,
}: ClientBriefV2Props) {
  // Derive user data from client.user when no explicit user prop is passed.
  // This ensures the sidebar shows the client's contact info (name, email, phone)
  // for roles like SALES that view other people's profiles.
  const resolvedUser =
    user ??
    (client.user
      ? {
          name: client.user.name,
          email: client.user.email,
          phoneWhatsapp: client.user.phoneWhatsapp,
          avatarUrl: client.user.avatarUrl,
        }
      : null);

  const {
    identity,
    kpis,
    profile: viewProfile,
    meta,
  } = useClientBrief({
    client,
    profile,
    user: resolvedUser,
  });

  const visibleSections =
    PROFILE_SECTION_VISIBILITY[role] ??
    PROFILE_SECTION_VISIBILITY[UserRole.ADMIN];

  // Render visible sections, filtering out those with no data
  const renderedSections = visibleSections
    .map((key) => {
      const renderer = SECTION_RENDERERS[key];
      if (!renderer) return null;
      const rendered = renderer(viewProfile!);
      if (!rendered) return null;
      return (
        <div key={key} className="break-inside-avoid mb-5">
          {rendered}
        </div>
      );
    })
    .filter(Boolean);

  const hasAnyRenderedSection = renderedSections.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <aside className="lg:col-span-4 xl:col-span-3">
        <IdentitySidebar
          identity={identity}
          role={role}
          decisionMakerName={viewProfile?.decisionMakerName}
          decisionMakerPhone={viewProfile?.decisionMakerPhone}
          workingHours={viewProfile?.workingHours}
        />
      </aside>

      <div className="lg:col-span-8 xl:col-span-9 space-y-5">
        <KpiGrid kpis={kpis} role={role} />

        {hasAnyRenderedSection ? (
          <div className="columns-1 xl:columns-2 gap-5">{renderedSections}</div>
        ) : (
          <EmptySection message="لم يتم إكمال الملف التعريفي بعد" />
        )}

        {meta.updatedAtLabel && (
          <p className="text-xs text-portal-note-text text-center">
            آخر تحديث: {meta.updatedAtLabel}
          </p>
        )}
      </div>
    </div>
  );
}
