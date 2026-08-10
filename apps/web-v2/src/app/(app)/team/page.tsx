import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Team Overview | Hassad",
};

export default function TeamOverviewPage() {
  return <ScreenPlaceholder label="Overview" />;
}
