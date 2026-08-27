"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, GripVertical, X } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Button from "@/app/_components/Button";
import SortableListItem from "@/app/_components/SortableListItem";
import { reorderWorkoutExercisesAction } from "../actions";
import type { WorkoutWithRelations } from "../_lib/getWorkout";

type WorkoutExerciseWithRelations = NonNullable<
  WorkoutWithRelations["workout_exercises"]
>[number];

type ReorderExercisesModalProps = {
  open: boolean;
  workoutId: string;
  exercises: WorkoutExerciseWithRelations[];
  onClose: () => void;
  onReordered: (orderedWorkoutExerciseIds: number[]) => void;
};

const ReorderExercisesModal = ({
  open,
  workoutId,
  exercises,
  onClose,
  onReordered,
}: ReorderExercisesModalProps) => {
  const [localOrder, setLocalOrder] = useState<WorkoutExerciseWithRelations[]>(
    exercises,
  );
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setLocalOrder(exercises);
      setError(null);
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const hasChanged = useMemo(
    () => localOrder.some((we, index) => we.id !== exercises[index]?.id),
    [localOrder, exercises],
  );

  const sensors = useSensors(
    // Distance (not delay) activation: this is a dedicated grip handle (already
    // touch-none, so it never fights native scrolling), so dragging should start
    // as soon as the pointer moves rather than requiring a hold-still delay.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(Number(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localOrder.findIndex((we) => we.id === active.id);
    const newIndex = localOrder.findIndex((we) => we.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setLocalOrder((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const handleSave = async () => {
    if (!hasChanged) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await reorderWorkoutExercisesAction({
        workoutId,
        orderedWorkoutExerciseIds: localOrder.map((we) => we.id),
      });
      toast.success("Exercise order updated");
      onReordered(localOrder.map((we) => we.id));
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden
        onClick={!saving ? onClose : undefined}
      />

      <div
        className={`relative z-10 flex h-[85dvh] max-h-[85dvh] w-full max-w-2xl flex-col rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-lg transition-transform duration-300 ease-out dark:border-neutral-800 dark:bg-neutral-900 ${
          mounted ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Reorder exercises"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            Reorder Exercises
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <DndContext
            id="reorder-exercises-modal-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localOrder.map((we) => we.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                {localOrder.map((we, index) => (
                  <SortableListItem key={we.id} id={we.id}>
                    {({ setNodeRef, style, dragHandleProps, isDragging }) => (
                      <div
                        ref={setNodeRef}
                        style={style}
                        className={`flex items-center gap-3 bg-white py-2 dark:bg-neutral-900${
                          isDragging ? " relative z-10 shadow-md" : ""
                        }`}
                      >
                        <span className="w-6 shrink-0 select-none text-center text-xs font-medium text-gray-400 dark:text-gray-500">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate select-none text-sm font-medium text-gray-900 dark:text-white">
                          {we.exercise?.name ?? "Exercise"}
                        </span>
                        <button
                          type="button"
                          {...dragHandleProps}
                          aria-label={`Drag to reorder ${we.exercise?.name ?? "exercise"}`}
                          className="inline-flex h-11 w-11 shrink-0 touch-none select-none [-webkit-touch-callout:none] cursor-grab items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
                        >
                          <GripVertical className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </SortableListItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="shrink-0 border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-neutral-800">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => void handleSave()}
              isLoading={saving}
              disabled={!hasChanged}
            >
              Save order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReorderExercisesModal;
