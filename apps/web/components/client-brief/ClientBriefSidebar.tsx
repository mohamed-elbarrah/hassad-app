"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { BriefCard } from "./BriefCard";
import { ClientBriefGauge } from "./ClientBriefGauge";
import { Palette, Target, ExternalLink } from "lucide-react";
import type { ClientBriefView } from "./ClientBrief";

interface ClientBriefSidebarProps {
  client: Client;
  profile: ClientProfile | null;
  viewAs: ClientBriefView;
}

export function ClientBriefSidebar({
  client,
  profile,
  viewAs,
}: ClientBriefSidebarProps) {
  const brandAssets = profile?.brandAssets;

  return (
    <div className="space-y-5">
      {/* Satisfaction — hidden from portal */}
      {viewAs !== "portal" && (
        <BriefCard
          title="معدل الرضا"
          description="تقييم العميل العام"
          icon={Target}
        >
          <div className="flex justify-center py-2">
            <ClientBriefGauge
              value={
                client.avgSatisfactionScore != null
                  ? (client.avgSatisfactionScore / 5) * 100
                  : 0
              }
              label="معدل الرضا"
              sublabel={
                client.avgSatisfactionScore != null
                  ? `${client.avgSatisfactionScore} من 5`
                  : "لا يوجد تقييم"
              }
            />
          </div>
        </BriefCard>
      )}

      <BriefCard
        title="الهوية البصرية"
        description="أصول العلامة التجارية"
        icon={Palette}
      >
        <div className="space-y-4">
          {brandAssets?.logoUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={brandAssets.logoUrl}
                alt="الشعار"
                className="w-12 h-12 rounded-lg object-contain border border-portal-card-border bg-white"
              />
              <div className="min-w-0">
                <p className="text-xs text-neutral-300">الشعار</p>
                <p className="text-xs text-portal-note-text truncate" dir="ltr">
                  {brandAssets.logoUrl}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-portal-note-text text-center py-4">
              لم يتم إضافة شعار
            </p>
          )}

          {brandAssets?.brandColors && brandAssets.brandColors.length > 0 && (
            <div>
              <p className="text-xs text-neutral-300 mb-2">ألوان العلامة</p>
              <div className="flex flex-wrap gap-2">
                {brandAssets.brandColors.map((color, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-portal-card-border px-2 py-1.5"
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-portal-card-border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-natural-100" dir="ltr">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {brandAssets?.fonts && brandAssets.fonts.length > 0 && (
            <div>
              <p className="text-xs text-neutral-300 mb-1">الخطوط</p>
              <p className="text-sm text-natural-100">
                {brandAssets.fonts.join("، ")}
              </p>
            </div>
          )}

          {brandAssets?.guidelinesUrl && (
            <a
              href={brandAssets.guidelinesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-secondary-500 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              دليل الهوية البصرية
            </a>
          )}

          {!brandAssets?.logoUrl &&
            !brandAssets?.brandColors?.length &&
            !brandAssets?.fonts?.length &&
            !brandAssets?.guidelinesUrl && (
              <p className="text-sm text-portal-note-text text-center py-6">
                لم تتم إضافة أصول بصرية بعد
              </p>
            )}
        </div>
      </BriefCard>
    </div>
  );
}
