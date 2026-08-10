import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "CRM Contracts | Hassad",
};

export default function CrmContractsPage() {
  return <ScreenPlaceholder label="Contracts" />;
}
