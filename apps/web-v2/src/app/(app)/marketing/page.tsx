import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Marketing Overview | Hassad",
};

export default function MarketingOverviewPage() {
  return <ScreenPlaceholder label="Overview" />;
}
