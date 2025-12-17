import { useState } from 'react';
import { Board, Task, Column as ColumnType } from '@/types/fechamento';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { fechamentoService } from '@/services/fechamentoLocalStorage';

interface KanbanBoardProps {
  board: Board;
  tasks: Task[];
  onTasksChange: () => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}

export function KanbanBoard({ board, tasks, onTasksChange, onTaskClick, onAddTask }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter((task) => task.columnId === columnId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if we're over a column
    const isOverColumn = board.columns.some((c) => c.id === overId);
    
    if (isOverColumn && activeTask.columnId !== overId) {
      // Moving to a different column
      const columnTasks = getTasksByColumn(overId);
      fechamentoService.moveTask(activeId, overId, columnTasks.length);
      onTasksChange();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask) return;

    if (overTask) {
      // Reordering within same column or moving to another task's position
      const targetColumnId = overTask.columnId;
      const columnTasks = getTasksByColumn(targetColumnId).sort((a, b) => a.order - b.order);
      
      const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
      const overIndex = columnTasks.findIndex((t) => t.id === overId);

      if (activeTask.columnId === targetColumnId) {
        // Same column reorder
        const newOrder = arrayMove(columnTasks, activeIndex, overIndex);
        fechamentoService.reorderTasks(
          board.id,
          targetColumnId,
          newOrder.map((t) => t.id)
        );
      } else {
        // Move to different column
        fechamentoService.moveTask(activeId, targetColumnId, overIndex);
      }
      onTasksChange();
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.sort((a, b) => a.order - b.order).map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByColumn(column.id)}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask(column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-3 scale-105">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
