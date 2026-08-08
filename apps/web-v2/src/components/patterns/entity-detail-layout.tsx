import type { ReactNode } from "react";

type EntityDetailLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function EntityDetailLayout({
  sidebar,
  children,
}: EntityDetailLayoutProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(18rem,0.34fr)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 xl:sticky xl:top-[4.75rem] xl:self-start">
        {sidebar}
      </aside>
      <section className="flex min-w-0 flex-col gap-5">{children}</section>
    </div>
  );
}
