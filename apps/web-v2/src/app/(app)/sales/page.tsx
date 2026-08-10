import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Sales Overview | Hassad",
};

export default function SalesOverviewPage() {
  return <ScreenPlaceholder label="Overview" />;
}
