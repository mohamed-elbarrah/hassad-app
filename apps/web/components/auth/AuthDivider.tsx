"use client";

interface AuthDividerProps {
  text?: string;
}

export function AuthDivider({ text = "أو" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-neutral-200" />
      <span className="text-sm text-neutral-300 font-medium">{text}</span>
      <div className="flex-1 h-px bg-neutral-200" />
    </div>
  );
}
