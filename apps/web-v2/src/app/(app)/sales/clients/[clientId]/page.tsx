import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Sales Client Detail | Hassad",
};

export default function SalesClientDetailPage() {
  return <ScreenPlaceholder label="Client detail" />;
}
