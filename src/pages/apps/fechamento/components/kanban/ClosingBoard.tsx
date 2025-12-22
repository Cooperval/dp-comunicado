import { useState, useEffect } from "react";
import { Board, Card, Column, User, Project } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, BarChart3 } from "lucide-react";
import { ClosingCard } from "./ClosingCard";
import { CreateClosingTaskModal } from "./CreateClosingTaskModal";
import { CardDetailsModal } from "./CardDetailsModal";
import { GanttChart } from "./GanttChart";
import { ExcelExport } from "./ExcelExport";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { canMoveToColumn, recalculateDates, getAllCards } from "@/pages/apps/fechamento/lib/dependencyUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClosingBoardProps {
  board: Board;
  project: Project;
  members: User[];
  onUpdateBoard: (board: Board) => void;
  onBackToProjects: () => void;
}

export const ClosingBoard = ({
  board,
  project,
  members,
  onUpdateBoard,
  onBackToProjects
}: ClosingBoardProps) => {
  const [columns, setColumns] = useState<Column[]>(board.columns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showGantt, setShowGantt] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    setColumns(board.columns);
  }, [board]);

  const todoColumn = columns.find(c => c.closingColumnType === 'todo');
  const inProgressColumn = columns.find(c => c.closingColumnType === 'in-progress');
  const doneColumn = columns.find(c => c.closingColumnType === 'done');

  const handleDragStart = (event: DragStartEvent) => {
    const card = getAllCards(columns).find(c => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = columns.find(col => col.cards.some(c => c.id === activeId));
    let overColumn = columns.find(col => col.cards.some(c => c.id === overId));

    if (!overColumn) {
      overColumn = columns.find(col => col.id === overId);
    }

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    const activeCard = activeColumn.cards.find(c => c.id === activeId);
    if (!activeCard) return;

    // Check if move is allowed
    const moveCheck = canMoveToColumn(
      columns,
      activeCard,
      overColumn.id,
      doneColumn?.id || '',
      inProgressColumn?.id || ''
    );

    if (!moveCheck.canMove) {
      return; // Don't allow the move
    }

    setColumns(prev => {
      const newColumns = prev.map(col => {
        if (col.id === activeColumn.id) {
          return { ...col, cards: col.cards.filter(c => c.id !== activeId) };
        }
        if (col.id === overColumn!.id) {
          const overIndex = col.cards.findIndex(c => c.id === overId);
          const newCards = [...col.cards];
          const updatedCard = { ...activeCard, columnId: col.id };

          // Set actual dates when moving
          if (col.closingColumnType === 'in-progress' && !activeCard.actualStartDate) {
            updatedCard.actualStartDate = new Date();
          }
          if (col.closingColumnType === 'done' && !activeCard.actualEndDate) {
            updatedCard.actualEndDate = new Date();
          }

          if (overIndex >= 0) {
            newCards.splice(overIndex, 0, updatedCard);
          } else {
            newCards.push(updatedCard);
          }
          return { ...col, cards: newCards };
        }
        return col;
      });
      return newColumns;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCard = getAllCards(columns).find(c => c.id === active.id);
    if (!activeCard) return;

    // Recalculate dates for dependents if moved to done
    let updatedColumns = columns;
    const newColumn = columns.find(col => col.cards.some(c => c.id === active.id));

    if (newColumn?.closingColumnType === 'done' && project.baseStartDate) {
      updatedColumns = recalculateDates(columns, activeCard.id, project.baseStartDate);
    }

    const updatedBoard: Board = {
      ...board,
      columns: updatedColumns.map((col, idx) => ({
        ...col,
        position: idx,
        cards: col.cards.map((card, cardIdx) => ({
          ...card,
          position: cardIdx
        }))
      }))
    };

    onUpdateBoard(updatedBoard);
  };

  const handleCreateCard = (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'columnId' | 'position'>) => {
    if (!todoColumn) return;

    const newCard: Card = {
      ...cardData,
      id: `card-${Date.now()}`,
      columnId: todoColumn.id,
      position: todoColumn.cards.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedColumns = columns.map(col =>
      col.id === todoColumn.id
        ? { ...col, cards: [...col.cards, newCard] }
        : col
    );

    onUpdateBoard({ ...board, columns: updatedColumns });
    toast.success('Tarefa criada com sucesso!');
  };

  const handleUpdateCard = (cardId: string, updates: Partial<Card>) => {
    const updatedColumns = columns.map(col => ({
      ...col,
      cards: col.cards.map(card =>
        card.id === cardId ? { ...card, ...updates, updatedAt: new Date() } : card
      )
    }));
    onUpdateBoard({ ...board, columns: updatedColumns });
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedColumns = columns.map(col => ({
      ...col,
      cards: col.cards.filter(c => c.id !== cardId)
    }));
    onUpdateBoard({ ...board, columns: updatedColumns });
    setSelectedCard(null);
    toast.success('Tarefa removida!');
  };

  const monthName = project.closingMonth
    ? format(new Date(2024, project.closingMonth - 1), 'MMMM', { locale: ptBR })
    : '';

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBackToProjects}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">
                Fechamento {monthName} {project.closingYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowGantt(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Gantt
            </Button>
            <ExcelExport board={{ ...board, columns }} projectName={project.name} />
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map(column => (
              <div
                key={column.id}
                className="w-80 flex flex-col bg-card/50 rounded-xl border"
                style={{
                  backgroundColor: column.backgroundColor ? `${column.backgroundColor}40` : undefined
                }}
              >
                {/* Column Header */}
                <div
                  className="p-3 border-b rounded-t-xl"
                  style={{
                    backgroundColor: column.backgroundColor,
                    color: column.titleColor
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{column.title}</h3>
                    <span className="text-sm opacity-70">{column.cards.length}</span>
                  </div>
                </div>

                {/* Cards */}
                <SortableContext
                  items={column.cards.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                    {column.cards.map(card => (
                      <ClosingCard
                        key={card.id}
                        card={card}
                        columns={columns}
                        doneColumnId={doneColumn?.id || ''}
                        onClick={() => setSelectedCard(card)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="bg-card border rounded-lg p-3 shadow-xl opacity-90">
              <p className="font-medium">{activeCard.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <CreateClosingTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateCard}
        columns={columns}
        members={members}
        baseStartDate={project.baseStartDate || new Date()}
      />

      {selectedCard && (
        <CardDetailsModal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          card={selectedCard}
          onUpdate={(updates) => handleUpdateCard(selectedCard.id, updates)}
          onDelete={() => handleDeleteCard(selectedCard.id)}
        />
      )}

      <Dialog open={showGantt} onOpenChange={setShowGantt}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Gráfico de Gantt - {project.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-100px)]">
            <GanttChart board={{ ...board, columns }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};