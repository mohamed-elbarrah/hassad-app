/**
 * ClientBriefV2 - View mode implementation using shared ProfileSections
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
import { IdentitySidebar } from "./IdentitySidebar";
import { KpiGrid } from "./KpiGrid";
import { EmptySection } from "./EmptySection";
import { useClientBrief, type ClientBriefView } from "./useClientBrief";
import {
  CommunicationSection,
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
  viewAs?: ClientBriefView;
}

export function ClientBriefV2({
  client,
  profile,
  viewAs = "internal",
}: ClientBriefV2Props) {
  const {
    identity,
    kpis,
    profile: viewProfile,
    meta,
  } = useClientBrief({
    client,
    profile,
    viewAs,
  });

  const hasAnyProfileSection = Boolean(
    viewProfile?.communicationInfo ||
    viewProfile?.productInfo ||
    viewProfile?.audienceInfo ||
    viewProfile?.brandVoice ||
    viewProfile?.customerJourney ||
    viewProfile?.campaignInfo ||
    viewProfile?.pastPerformance ||
    viewProfile?.budgetInfo ||
    viewProfile?.visualIdentityInfo,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <aside className="lg:col-span-4 xl:col-span-3">
        <IdentitySidebar
          identity={identity}
          decisionMakerName={viewProfile?.decisionMakerName}
          decisionMakerPhone={viewProfile?.decisionMakerPhone}
          workingHours={viewProfile?.workingHours}
        />
      </aside>

      <div className="lg:col-span-8 xl:col-span-9 space-y-5">
        <KpiGrid kpis={kpis} />

        {hasAnyProfileSection ? (
          <div className="columns-1 xl:columns-2 gap-5">
            <div className="break-inside-avoid mb-5">
              <CommunicationSection
                mode="view"
                initialData={viewProfile?.communicationInfo ?? undefined}
              />
            </div>

            <div className="break-inside-avoid mb-5">
              <ProductSection
                mode="view"
                initialData={viewProfile?.productInfo ?? undefined}
              />
            </div>

            <div className="break-inside-avoid mb-5">
              <AudienceSection
                mode="view"
                initialData={{
                  customerAnalysis: viewProfile?.audienceInfo?.customerAnalysis,
                  faq: viewProfile?.audienceInfo?.faq,
                  toneOfVoice: viewProfile?.brandVoice?.toneOfVoice,
                  boundaries: viewProfile?.brandVoice?.boundaries,
                  verbalSlogan: viewProfile?.brandVoice?.verbalSlogan,
                  appearanceMethod: viewProfile?.brandVoice?.appearanceMethod,
                }}
              />
            </div>

            <div className="break-inside-avoid mb-5">
              <JourneySection
                mode="view"
                initialData={viewProfile?.customerJourney ?? undefined}
              />
            </div>

            <div className="break-inside-avoid mb-5">
              <CampaignSection
                mode="view"
                initialData={viewProfile?.campaignInfo ?? undefined}
              />
            </div>

            <div className="break-inside-avoid mb-5">
              <PerformanceSection
                mode="view"
                initialData={{
                  pastPerformance: viewProfile?.pastPerformance ?? undefined,
                  budgetInfo: viewProfile?.budgetInfo ?? undefined,
                }}
              />
            </div>

            <div className="break-inside-avoid mb-5">
              <VisualSection
                mode="view"
                initialData={{
                  hasVisualIdentity:
                    viewProfile?.visualIdentityInfo?.hasVisualIdentity,
                  pastDesigns: viewProfile?.visualIdentityInfo?.pastDesigns,
                  visualDirection:
                    viewProfile?.visualIdentityInfo?.visualDirection,
                  brandAssets: viewProfile?.visualIdentityInfo?.brandAssets,
                  productPhotos: viewProfile?.visualIdentityInfo?.productPhotos,
                }}
              />
            </div>
          </div>
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
