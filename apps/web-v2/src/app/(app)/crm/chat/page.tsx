import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "CRM Chat | Hassad",
};

export default function CrmChatPage() {
  return <ScreenPlaceholder label="Chat" />;
}
