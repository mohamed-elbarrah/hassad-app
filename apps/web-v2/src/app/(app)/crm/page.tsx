import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "CRM Overview | Hassad",
};

export default function CrmPage() {
  return <ScreenPlaceholder label="Overview" />;
}
