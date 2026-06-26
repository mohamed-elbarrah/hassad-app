"use client";

interface EmptySectionProps {
  message?: string;
}

export function EmptySection({
  message = "لم تتم إضافة معلومات بعد",
}: EmptySectionProps) {
  return (
    <p className="text-sm text-portal-note-text text-center py-6">{message}</p>
  );
}
