import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Marketing Campaigns | Hassad",
};

export default function CampaignsPage() {
  return <ScreenPlaceholder label="Campaigns" />;
}
