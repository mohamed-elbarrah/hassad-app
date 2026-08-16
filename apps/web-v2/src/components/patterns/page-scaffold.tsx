type PageScaffoldProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  hideHeader?: boolean;
  children: React.ReactNode;
};

export function PageScaffold({
  title,
  description,
  actions,
  hideHeader = false,
  children,
}: PageScaffoldProps) {
  return (
    <main className="flex min-w-0 w-full flex-1 flex-col gap-5">
      {!hideHeader && (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-3xl flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </header>
      )}
      {children}
    </main>
  );
}
