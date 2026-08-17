"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  StatusBadge,
  type StatusTone,
} from "@/components/patterns/status-badge";
import { cn } from "@/lib/utils";

export type KanbanItem = {
  id: string;
};

export type KanbanSection<TItem extends KanbanItem> = {
  id: string;
  title: string;
  tone: StatusTone;
  items: TItem[];
  description?: string;
  emptyLabel?: string;
};

export type KanbanLane<TItem extends KanbanItem> = {
  id: string;
  title: string;
  tone: StatusTone;
  sections: KanbanSection<TItem>[];
};

type GroupedKanbanBoardProps<TItem extends KanbanItem> = {
  lanes: KanbanLane<TItem>[];
  renderCard: (item: TItem, state: { isDragging: boolean }) => React.ReactNode;
  onMoveItem?: (payload: {
    itemId: string;
    fromSectionId: string;
    toSectionId: string;
  }) => void | Promise<void>;
  emptyState?: React.ReactNode;
};

function StaticKanbanCard<TItem extends KanbanItem>({
  item,
  renderCard,
}: {
  item: TItem;
  renderCard: (item: TItem, state: { isDragging: boolean }) => React.ReactNode;
}) {
  return (
    <div className="group relative">
      <Card size="sm" className="relative bg-background/95 shadow-sm">
        <CardContent className="space-y-3 py-3 pr-10">
          {renderCard(item, { isDragging: false })}
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanDraggableCard<TItem extends KanbanItem>({
  item,
  sectionId,
  renderCard,
}: {
  item: TItem;
  sectionId: string;
  renderCard: (item: TItem, state: { isDragging: boolean }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: { sectionId },
    });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "group relative transition-transform",
        isDragging && "z-10 opacity-80",
      )}
      {...attributes}
    >
      <Card
        size="sm"
        className={cn(
          "relative bg-background/95 shadow-sm",
          isDragging && "ring-2 ring-ring/30",
        )}
      >
        <CardContent className="space-y-3 py-3 pr-10">
          {renderCard(item, { isDragging })}
        </CardContent>
      </Card>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Drag card"
        {...listeners}
      >
        <GripVerticalIcon />
      </Button>
    </div>
  );
}

function KanbanSectionColumn<TItem extends KanbanItem>({
  section,
  renderCard,
  interactive,
}: {
  section: KanbanSection<TItem>;
  renderCard: (item: TItem, state: { isDragging: boolean }) => React.ReactNode;
  interactive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: section.id });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-20 flex-col rounded-xl border bg-muted/20",
        isOver && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="size-2 rounded-full bg-current opacity-70" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{section.title}</p>
            {section.description ? (
              <p className="truncate text-[11px] text-muted-foreground">
                {section.description}
              </p>
            ) : null}
          </div>
        </div>
        <StatusBadge tone={section.tone}>{section.items.length}</StatusBadge>
      </div>

      <div className="flex flex-col gap-2 p-2">
        {section.items.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-4 text-xs text-muted-foreground">
            {section.emptyLabel ?? "No cards in this stage."}
          </div>
        ) : (
          section.items.map((item) =>
            interactive ? (
              <KanbanDraggableCard
                key={item.id}
                item={item}
                sectionId={section.id}
                renderCard={renderCard}
              />
            ) : (
              <StaticKanbanCard
                key={item.id}
                item={item}
                renderCard={renderCard}
              />
            ),
          )
        )}
      </div>
    </section>
  );
}

function moveItem<TItem extends KanbanItem>(
  lanes: KanbanLane<TItem>[],
  itemId: string,
  fromSectionId: string,
  toSectionId: string,
) {
  if (fromSectionId === toSectionId) return lanes;

  let movingItem: TItem | null = null;

  const withoutItem = lanes.map((lane) => ({
    ...lane,
    sections: lane.sections.map((section) => {
      if (section.id !== fromSectionId) return section;

      const nextItems = section.items.filter((item) => {
        if (item.id !== itemId) return true;
        movingItem = item;
        return false;
      });

      return { ...section, items: nextItems };
    }),
  }));

  if (!movingItem) return lanes;

  return withoutItem.map((lane) => ({
    ...lane,
    sections: lane.sections.map((section) => {
      if (section.id !== toSectionId) return section;
      return { ...section, items: [...section.items, movingItem as TItem] };
    }),
  }));
}

export function GroupedKanbanBoard<TItem extends KanbanItem>({
  lanes,
  renderCard,
  onMoveItem,
  emptyState,
}: GroupedKanbanBoardProps<TItem>) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [viewLanes, setViewLanes] = useState(lanes);

  useEffect(() => {
    setViewLanes(lanes);
  }, [lanes]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const sectionIndex = useMemo(() => {
    const index = new Map<string, { laneId: string; sectionId: string }>();

    for (const lane of viewLanes) {
      for (const section of lane.sections) {
        index.set(section.id, { laneId: lane.id, sectionId: section.id });
      }
    }

    return index;
  }, [viewLanes]);

  const [isMoving, setIsMoving] = useState(false);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (isMoving) return;

    const itemId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId) return;

    const sourceMeta = event.active.data.current as
      | { sectionId?: string }
      | undefined;
    const sourceSectionId = sourceMeta?.sectionId;

    if (!sourceSectionId) return;

    const targetMeta = sectionIndex.get(overId);
    const targetSectionId = targetMeta?.sectionId;

    if (!targetSectionId || targetSectionId === sourceSectionId) return;

    const previousLanes = viewLanes;
    const nextLanes = moveItem(
      previousLanes,
      itemId,
      sourceSectionId,
      targetSectionId,
    );

    if (nextLanes === previousLanes) return;

    setViewLanes(nextLanes);
    setIsMoving(true);

    try {
      await onMoveItem?.({
        itemId,
        fromSectionId: sourceSectionId,
        toSectionId: targetSectionId,
      });
    } catch {
      setViewLanes(previousLanes);
    } finally {
      setIsMoving(false);
    }
  };

  const totalCards = viewLanes.reduce(
    (laneTotal, lane) =>
      laneTotal +
      lane.sections.reduce(
        (sectionTotal, section) => sectionTotal + section.items.length,
        0,
      ),
    0,
  );

  if (totalCards === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const content = (
    <ScrollArea className="w-full">
      <div className="flex min-w-max gap-4 pb-2">
        {viewLanes.map((lane) => {
          const laneCount = lane.sections.reduce(
            (sum, section) => sum + section.items.length,
            0,
          );

          return (
            <Card
              key={lane.id}
              className="min-w-[22rem] max-w-[22rem] flex-col border-border/70 bg-card/95 shadow-sm ]"
              size="sm"
            >
              <CardHeader className="gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-current opacity-75" />
                  <CardTitle className="text-sm font-semibold">
                    {lane.title}
                  </CardTitle>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="tabular-nums">
                    {lane.sections.length} groups
                  </Badge>
                  <StatusBadge tone={lane.tone}>{laneCount}</StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto px-3 py-3">
                <div className="flex flex-col gap-3">
                  {lane.sections.map((section) => (
                    <KanbanSectionColumn
                      key={section.id}
                      section={section}
                      renderCard={renderCard}
                      interactive={mounted && !isMoving}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );

  if (!mounted) {
    return content;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {content}
    </DndContext>
  );
}
