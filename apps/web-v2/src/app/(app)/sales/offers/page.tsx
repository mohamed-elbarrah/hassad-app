import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Sales Offers | Hassad",
};

export default function OffersPage() {
  return <ScreenPlaceholder label="Offers" />;
}
