import { Link } from "./AuthLink";

interface AuthFooterProps {
  text: string;
  buttonText: string;
  href: string;
}

export function AuthFooter({ text, buttonText, href }: AuthFooterProps) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{text}</span>
        <Link href={href}>{buttonText}</Link>
      </div>
      <span className="text-xs text-muted-foreground">© نظام مسار 2026</span>
    </div>
  );
}
