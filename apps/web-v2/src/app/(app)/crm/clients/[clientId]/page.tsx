import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "CRM Client Detail | Hassad",
};

export default function CrmClientDetailPage() {
  return <ScreenPlaceholder label="Client detail" />;
}
