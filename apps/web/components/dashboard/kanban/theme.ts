export interface KanbanToneClasses {
  dotClass: string;
  bandClass: string;
  surfaceClass: string;
  countClass: string;
  fillClass: string;
  badgeClass: string;
}

function createToneClasses(tone: KanbanToneClasses): KanbanToneClasses {
  return tone;
}

export const KANBAN_TONES = {
  neutral: createToneClasses({
    dotClass: "bg-muted-foreground",
    bandClass: "bg-muted",
    surfaceClass: "bg-muted/60",
    countClass: "bg-muted text-muted-foreground",
    fillClass: "bg-muted-foreground",
    badgeClass: "border-border bg-muted text-muted-foreground",
  }),
  blue: createToneClasses({
    dotClass: "bg-blue-500",
    bandClass: "bg-blue-50 dark:bg-blue-950/30",
    surfaceClass: "bg-blue-50/60 dark:bg-blue-950/20",
    countClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    fillClass: "bg-blue-500",
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  }),
  cyan: createToneClasses({
    dotClass: "bg-cyan-500",
    bandClass: "bg-cyan-50 dark:bg-cyan-950/30",
    surfaceClass: "bg-cyan-50/60 dark:bg-cyan-950/20",
    countClass:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    fillClass: "bg-cyan-500",
    badgeClass:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
  }),
  purple: createToneClasses({
    dotClass: "bg-violet-500",
    bandClass: "bg-violet-50 dark:bg-violet-950/30",
    surfaceClass: "bg-violet-50/60 dark:bg-violet-950/20",
    countClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    fillClass: "bg-violet-500",
    badgeClass:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  }),
  yellow: createToneClasses({
    dotClass: "bg-amber-500",
    bandClass: "bg-amber-50 dark:bg-amber-950/30",
    surfaceClass: "bg-amber-50/60 dark:bg-amber-950/20",
    countClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    fillClass: "bg-amber-500",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  }),
  orange: createToneClasses({
    dotClass: "bg-orange-500",
    bandClass: "bg-orange-50 dark:bg-orange-950/30",
    surfaceClass: "bg-orange-50/60 dark:bg-orange-950/20",
    countClass:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    fillClass: "bg-orange-500",
    badgeClass:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  }),
  green: createToneClasses({
    dotClass: "bg-emerald-500",
    bandClass: "bg-emerald-50 dark:bg-emerald-950/30",
    surfaceClass: "bg-emerald-50/60 dark:bg-emerald-950/20",
    countClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    fillClass: "bg-emerald-500",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  }),
  red: createToneClasses({
    dotClass: "bg-red-500",
    bandClass: "bg-red-50 dark:bg-red-950/30",
    surfaceClass: "bg-red-50/60 dark:bg-red-950/20",
    countClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    fillClass: "bg-red-500",
    badgeClass:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  }),
} as const;
