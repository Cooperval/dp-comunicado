import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Board, Card as CardType, Column } from "@/pages/apps/fechamento/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { CreateCardModal } from "./CreateCardModal";
import { ExcelExport } from "./ExcelExport";
import { GanttChart } from "./GanttChart";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ArrowLeft, BarChart3 } from "lucide-react";

interface KanbanBoardProps {
  board: Board;
  projectName: string;
  onUpdateBoard: (board: Board) => void;
  onBackToProjects: () => void;
}

export const KanbanBoard = ({ 
  board, 
  projectName, 
  onUpdateBoard, 
  onBackToProjects 
}: KanbanBoardProps) => {
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [columns, setColumns] = useState<Column[]>(board.columns);
  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);
  const [isGanttOpen, setIsGanttOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    if (active.data.current?.type === "card") {
      const card = active.data.current.card;
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === "card";
    const isOverColumn = over.data.current?.type === "column";
    const isOverCard = over.data.current?.type === "card";

    if (isActiveCard) {
      if (isOverColumn) {
        // Moving card to empty column
        const activeColumn = columns.find(col => 
          col.cards.some(card => card.id === activeId)
        );
        const overColumn = columns.find(col => col.id === overId);

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

        const activeCard = activeColumn.cards.find(card => card.id === activeId);
        if (!activeCard) return;

        setColumns(prev => {
          const newColumns = [...prev];
          
          // Remove card from active column
          const activeColIndex = newColumns.findIndex(col => col.id === activeColumn.id);
          newColumns[activeColIndex] = {
            ...newColumns[activeColIndex],
            cards: newColumns[activeColIndex].cards.filter(card => card.id !== activeId)
          };

          // Add card to over column
          const overColIndex = newColumns.findIndex(col => col.id === overColumn.id);
          const updatedCard = { ...activeCard, columnId: overColumn.id };
          newColumns[overColIndex] = {
            ...newColumns[overColIndex],
            cards: [...newColumns[overColIndex].cards, updatedCard]
          };

          return newColumns;
        });
      } else if (isOverCard) {
        // Moving card to position of another card
        const activeColumn = columns.find(col => 
          col.cards.some(card => card.id === activeId)
        );
        const overColumn = columns.find(col => 
          col.cards.some(card => card.id === overId)
        );

        if (!activeColumn || !overColumn) return;

        if (activeColumn.id === overColumn.id) {
          // Same column - reorder
          const columnIndex = columns.findIndex(col => col.id === activeColumn.id);
          const oldIndex = activeColumn.cards.findIndex(card => card.id === activeId);
          const newIndex = activeColumn.cards.findIndex(card => card.id === overId);

          setColumns(prev => {
            const newColumns = [...prev];
            newColumns[columnIndex] = {
              ...newColumns[columnIndex],
              cards: arrayMove(newColumns[columnIndex].cards, oldIndex, newIndex)
            };
            return newColumns;
          });
        } else {
          // Different columns
          const activeCard = activeColumn.cards.find(card => card.id === activeId);
          if (!activeCard) return;

          const overIndex = overColumn.cards.findIndex(card => card.id === overId);

          setColumns(prev => {
            const newColumns = [...prev];
            
            // Remove from active column
            const activeColIndex = newColumns.findIndex(col => col.id === activeColumn.id);
            newColumns[activeColIndex] = {
              ...newColumns[activeColIndex],
              cards: newColumns[activeColIndex].cards.filter(card => card.id !== activeId)
            };

            // Add to over column at specific position
            const overColIndex = newColumns.findIndex(col => col.id === overColumn.id);
            const updatedCard = { ...activeCard, columnId: overColumn.id };
            const newCards = [...newColumns[overColIndex].cards];
            newCards.splice(overIndex, 0, updatedCard);
            newColumns[overColIndex] = {
              ...newColumns[overColIndex],
              cards: newCards
            };

            return newColumns;
          });
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    
    // Update the board with new column state
    onUpdateBoard({
      ...board,
      columns: columns
    });
  };

  const addColumn = () => {
    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: 'Nova Coluna',
      position: columns.length,
      boardId: board.id,
      cards: []
    };

    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    onUpdateBoard({
      ...board,
      columns: updatedColumns
    });
  };

  const updateColumn = (columnId: string, updates: Partial<Column>) => {
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, ...updates } : col
    );
    setColumns(updatedColumns);
    onUpdateBoard({
      ...board,
      columns: updatedColumns
    });
  };

  const deleteColumn = (columnId: string) => {
    const updatedColumns = columns.filter(col => col.id !== columnId);
    setColumns(updatedColumns);
    onUpdateBoard({
      ...board,
      columns: updatedColumns
    });
  };

  const addCard = (columnId: string) => {
    setTargetColumnId(columnId);
    setIsCreateCardModalOpen(true);
  };

  const handleCreateCard = (cardData: Omit<CardType, 'id' | 'createdAt' | 'updatedAt' | 'columnId' | 'position'>) => {
    if (!targetColumnId) return;

    const newCard: CardType = {
      ...cardData,
      id: `card-${Date.now()}`,
      columnId: targetColumnId,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      checklist: cardData.checklist || []
    };

    const updatedColumns = columns.map(col =>
      col.id === targetColumnId
        ? { ...col, cards: [...col.cards, newCard] }
        : col
    );
    
    setColumns(updatedColumns);
    onUpdateBoard({
      ...board,
      columns: updatedColumns
    });
    setTargetColumnId(null);
  };

  const updateCard = (cardId: string, updates: Partial<CardType>) => {
    const updatedColumns = columns.map(col => ({
      ...col,
      cards: col.cards.map(card =>
        card.id === cardId 
          ? { ...card, ...updates, updatedAt: new Date() }
          : card
      )
    }));
    
    setColumns(updatedColumns);
    onUpdateBoard({
      ...board,
      columns: updatedColumns
    });
  };

  const deleteCard = (cardId: string) => {
    const updatedColumns = columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => card.id !== cardId)
    }));
    
    setColumns(updatedColumns);
    onUpdateBoard({
      ...board,
      columns: updatedColumns
    });
  };

  const columnIds = columns.map(col => col.id);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBackToProjects}
            className="transition-organic hover:shadow-soft"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{projectName}</h1>
            <p className="text-muted-foreground">Gestão de tarefas e indicadores</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsGanttOpen(true)}
            className="transition-organic hover:shadow-soft"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Gráfico de Gantt
          </Button>
          <ExcelExport board={{ ...board, columns }} projectName={projectName} />
          <Button 
            onClick={addColumn}
            className="gradient-primary hover:shadow-glow transition-organic"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Coluna
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 gradient-earth p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-6 pb-6">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onUpdateColumn={updateColumn}
                  onDeleteColumn={deleteColumn}
                  onAddCard={addCard}
                  onUpdateCard={updateCard}
                  onDeleteCard={deleteCard}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="kanban-card dragging">
                <KanbanCard
                  card={activeCard}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  isDragging={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <CreateCardModal
          isOpen={isCreateCardModalOpen}
          onClose={() => {
            setIsCreateCardModalOpen(false);
            setTargetColumnId(null);
          }}
          onSave={handleCreateCard}
        />
      </div>

      {/* Gantt Chart Modal */}
      <Dialog open={isGanttOpen} onOpenChange={setIsGanttOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Gráfico de Gantt - {projectName}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 h-[calc(90vh-100px)] overflow-auto">
            <GanttChart board={{ ...board, columns }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};