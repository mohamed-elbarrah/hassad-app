export interface KanbanToneClasses {
  dotClass: string;
  bandClass: string;
  surfaceClass: string;
  countClass: string;
  fillClass: string;
  badgeClass: string;
}

function createToneClasses(
  tone: KanbanToneClasses,
): KanbanToneClasses {
  return tone;
}

export const KANBAN_TONES = {
  neutral: createToneClasses({
    dotClass: "bg-badge-gray-text",
    bandClass: "bg-badge-gray-bg",
    surfaceClass: "bg-badge-gray-bg/60",
    countClass: "bg-badge-gray-bg text-badge-gray-text",
    fillClass: "bg-badge-gray-text",
    badgeClass:
      "border-border bg-badge-gray-bg text-badge-gray-text/90",
  }),
  blue: createToneClasses({
    dotClass: "bg-action-blue",
    bandClass: "bg-action-blue-soft",
    surfaceClass: "bg-action-blue-soft/60",
    countClass: "bg-action-blue-soft text-action-blue",
    fillClass: "bg-action-blue",
    badgeClass:
      "border-action-blue/20 bg-action-blue-soft text-action-blue",
  }),
  cyan: createToneClasses({
    dotClass: "bg-action-cyan",
    bandClass: "bg-action-cyan-soft",
    surfaceClass: "bg-action-cyan-soft/60",
    countClass: "bg-action-cyan-soft text-action-cyan",
    fillClass: "bg-action-cyan",
    badgeClass:
      "border-action-cyan/20 bg-action-cyan-soft text-action-cyan",
  }),
  purple: createToneClasses({
    dotClass: "bg-action-purple",
    bandClass: "bg-action-purple-soft",
    surfaceClass: "bg-action-purple-soft/60",
    countClass: "bg-action-purple-soft text-action-purple",
    fillClass: "bg-action-purple",
    badgeClass:
      "border-action-purple/20 bg-action-purple-soft text-action-purple",
  }),
  yellow: createToneClasses({
    dotClass: "bg-badge-yellow-text",
    bandClass: "bg-badge-yellow-bg",
    surfaceClass: "bg-badge-yellow-bg/60",
    countClass: "bg-badge-yellow-bg text-badge-yellow-text",
    fillClass: "bg-badge-yellow-text",
    badgeClass:
      "border-badge-yellow-bg bg-badge-yellow-bg text-badge-yellow-text",
  }),
  orange: createToneClasses({
    dotClass: "bg-badge-orange-text",
    bandClass: "bg-badge-orange-bg",
    surfaceClass: "bg-badge-orange-bg/60",
    countClass: "bg-badge-orange-bg text-badge-orange-text",
    fillClass: "bg-badge-orange-text",
    badgeClass:
      "border-badge-orange-bg bg-badge-orange-bg text-badge-orange-text",
  }),
  green: createToneClasses({
    dotClass: "bg-badge-green-text",
    bandClass: "bg-badge-green-bg",
    surfaceClass: "bg-badge-green-bg/60",
    countClass: "bg-badge-green-bg text-badge-green-text",
    fillClass: "bg-badge-green-text",
    badgeClass:
      "border-badge-green-bg bg-badge-green-bg text-badge-green-text",
  }),
  red: createToneClasses({
    dotClass: "bg-destructive",
    bandClass: "bg-destructive/10",
    surfaceClass: "bg-destructive/5",
    countClass: "bg-destructive/10 text-destructive",
    fillClass: "bg-destructive",
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
  }),
} as const;
