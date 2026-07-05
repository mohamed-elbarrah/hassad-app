"use client";

import {
  Building2,
  User,
  Mail,
  Phone,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import Link from "next/link";

interface ClientUser {
  id: string;
  name: string;
  email: string;
  phoneWhatsapp: string | null;
  avatarUrl: string | null;
}

interface ClientManager {
  id: string;
  name: string;
}

interface ClientData {
  id: string;
  companyName: string;
  businessType?: string;
  user?: ClientUser | null;
  manager?: ClientManager | null;
}

interface InvoiceClientProfileProps {
  client: ClientData | null | undefined;
  clientId: string;
}

export function InvoiceClientProfile({
  client,
  clientId,
}: InvoiceClientProfileProps) {
  if (!client) {
    return (
      <div className="text-center py-4 text-portal-note-text text-sm">
        لا توجد معلومات عن العميل
      </div>
    );
  }

  const contactName = client.user?.name;
  const email = client.user?.email;
  const phone = client.user?.phoneWhatsapp;
  const managerName = client.manager?.name;

  return (
    <div>
      <h3 className="text-base font-medium text-natural-100 mb-4 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-portal-icon" />
        معلومات العميل
      </h3>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Company info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary-500/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-secondary-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-natural-100">
                {client.companyName}
              </p>
              {client.businessType && (
                <span className="text-[11px] text-portal-note-text">
                  {client.businessType}
                </span>
              )}
            </div>
          </div>

          {contactName && (
            <div className="flex items-center gap-2.5 pr-11">
              <User className="w-3.5 h-3.5 text-portal-icon shrink-0" />
              <span className="text-sm text-natural-100">{contactName}</span>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="flex-1 space-y-2.5">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2.5 text-sm text-natural-100 hover:text-secondary-500 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-portal-icon shrink-0" />
              {email}
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2.5 text-sm text-natural-100 hover:text-secondary-500 transition-colors font-mono"
            >
              <Phone className="w-3.5 h-3.5 text-portal-icon shrink-0" />
              {phone}
            </a>
          )}
          {managerName && (
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-3.5 h-3.5 text-portal-icon shrink-0" />
              <span className="text-sm text-portal-note-text">
                مدير الحساب:
              </span>
              <span className="text-sm font-medium text-natural-100">
                {managerName}
              </span>
            </div>
          )}
        </div>

        {/* Link */}
        <div className="shrink-0">
          <Link href={`/dashboard/finance/clients/${clientId}`}>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              الملف المالي
            </ActionButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
