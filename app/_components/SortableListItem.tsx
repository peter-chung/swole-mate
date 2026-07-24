import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortableListItemChildrenArgs = {
  setNodeRef: (element: HTMLElement | null) => void;
  style: React.CSSProperties;
  dragHandleProps: Record<string, unknown>;
  isDragging: boolean;
};

type SortableListItemProps = {
  id: number;
  children: (args: SortableListItemChildrenArgs) => React.ReactNode;
};

const SortableListItem = ({ id, children }: SortableListItemProps) => {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      {children({
        setNodeRef,
        style,
        dragHandleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </>
  );
};

export default SortableListItem;
