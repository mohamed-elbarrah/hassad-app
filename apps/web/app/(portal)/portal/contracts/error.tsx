"use client";

import { PortalPageError } from "@/components/portal/shared/PortalPageError";

export default function Error({
  error,
  reset: _reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <PortalPageError error={error} reset={_reset} />;
}
