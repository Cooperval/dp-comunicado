import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Column, Card } from "@/pages/apps/fechamento/types";
import { KanbanCard } from "./KanbanCard";
import { ColorPicker } from "./ColorPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Edit3, Trash2, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanColumnProps {
  column: Column;
  onUpdateColumn: (columnId: string, updates: Partial<Column>) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddCard: (columnId: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void;
  onDeleteCard: (cardId: string) => void;
}

export const KanbanColumn = ({
  column,
  onUpdateColumn,
  onDeleteColumn,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
}: KanbanColumnProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingStyle, setIsEditingStyle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [backgroundColor, setBackgroundColor] = useState(column.backgroundColor || '#ffffff');
  const [titleColor, setTitleColor] = useState(column.titleColor || '#000000');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTitleSave = () => {
    if (title.trim() && title !== column.title) {
      onUpdateColumn(column.id, { title: title.trim() });
    } else {
      setTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitle(column.title);
      setIsEditingTitle(false);
    }
  };

  const handleStyleSave = () => {
    onUpdateColumn(column.id, { 
      backgroundColor, 
      titleColor 
    });
    setIsEditingStyle(false);
  };

  const cardIds = column.cards.map(card => card.id);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: column.backgroundColor || '#ffffff',
      }}
      className={`kanban-column w-80 p-4 rounded-lg border border-border shadow-sm ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1" {...attributes} {...listeners}>
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyPress}
              className="text-lg font-semibold border-none shadow-none p-0 h-auto bg-transparent"
              style={{ color: column.titleColor || '#000000' }}
              autoFocus
            />
          ) : (
            <h3 
              className="text-lg font-semibold cursor-grab active:cursor-grabbing"
              style={{ color: column.titleColor || '#000000' }}
              onClick={() => setIsEditingTitle(true)}
            >
              {column.title}
            </h3>
          )}
          <p className="text-sm opacity-70" style={{ color: column.titleColor || '#000000' }}>
            {column.cards.length} {column.cards.length === 1 ? 'tarefa' : 'tarefas'}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-black/10 transition-organic"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Editar título
            </DropdownMenuItem>
            <Dialog open={isEditingStyle} onOpenChange={setIsEditingStyle}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Palette className="w-4 h-4 mr-2" />
                  Personalizar cores
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Personalizar Coluna</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <ColorPicker
                    color={backgroundColor}
                    onColorChange={setBackgroundColor}
                    label="Cor de fundo da coluna"
                  />
                  
                  <ColorPicker
                    color={titleColor}
                    onColorChange={setTitleColor}
                    label="Cor do título"
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingStyle(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleStyleSave}>
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenuItem 
              onClick={() => onDeleteColumn(column.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir coluna
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[100px]">
          {column.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onUpdate={(updates) => onUpdateCard(card.id, updates)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Card Button */}
      <Button
        variant="ghost"
        onClick={() => onAddCard(column.id)}
        className="w-full mt-4 border-2 border-dashed border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-organic"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar tarefa
      </Button>
    </div>
  );
};