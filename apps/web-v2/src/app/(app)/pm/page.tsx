import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "PM Overview | Hassad",
};

export default function PmOverviewPage() {
  return <ScreenPlaceholder label="Overview" />;
}
