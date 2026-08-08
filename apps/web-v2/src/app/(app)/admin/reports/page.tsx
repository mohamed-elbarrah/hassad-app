import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Reports | Hassad",
};

export default function ReportsPage() {
  return <ScreenPlaceholder label="Reports" />;
}
