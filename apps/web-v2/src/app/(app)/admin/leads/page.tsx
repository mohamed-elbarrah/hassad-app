import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Leads | Hassad",
};

export default function LeadsPage() {
  return <ScreenPlaceholder label="Leads" />;
}
