import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Finance | Hassad",
};

export default function FinancePage() {
  return <ScreenPlaceholder label="Finance" />;
}
