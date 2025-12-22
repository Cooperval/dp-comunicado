import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/pages/apps/fechamento/types";
import { CardDetailsModal } from "./CardDetailsModal";
import { ColorPicker } from "./ColorPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Scale,
  MapPin,
  Percent,
  Palette,
  Paperclip,
  CheckSquare,
  CalendarIcon
} from "lucide-react";
import { formatDateRange, getDateStatus } from "@/pages/apps/fechamento/lib/dateUtils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KanbanCardProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

const valueTypeIcons = {
  currency: <DollarSign className="w-4 h-4" />,
  tons: <Scale className="w-4 h-4" />,
  hectares: <MapPin className="w-4 h-4" />,
  percentage: <Percent className="w-4 h-4" />
};

const valueTypeLabels = {
  currency: 'R$',
  tons: 't',
  hectares: 'ha',
  percentage: '%'
};

const priorityColors = {
  low: 'bg-success/20 text-success-foreground border-success/30',
  medium: 'bg-warning/20 text-warning-foreground border-warning/30',
  high: 'bg-destructive/20 text-destructive-foreground border-destructive/30'
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

export const KanbanCard = ({ 
  card, 
  onUpdate, 
  onDelete, 
  isDragging = false 
}: KanbanCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState(card);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [titleColor, setTitleColor] = useState(card.titleColor || '#000000');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onUpdate({ ...editedCard, titleColor });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCard(card);
    setTitleColor(card.titleColor || '#000000');
    setIsEditing(false);
  };

  const formatValue = (value: number | undefined, type: string | undefined) => {
    if (!value || !type) return null;
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      case 'tons':
        return `${value.toLocaleString('pt-BR')} t`;
      case 'hectares':
        return `${value.toLocaleString('pt-BR')} ha`;
      case 'percentage':
        return `${value.toLocaleString('pt-BR')}%`;
      default:
        return value.toString();
    }
  };

  if (isDragging) {
    return (
      <div className="kanban-card opacity-50">
        <h4 className="font-medium text-card-foreground mb-2">{card.title}</h4>
        {card.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {card.description}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="kanban-card cursor-pointer"
        onClick={() => setIsDetailsModalOpen(true)}
      >
      <div className="flex items-start justify-between mb-2">
        <h4 
          className="font-medium flex-1 pr-2"
          style={{ color: card.titleColor || '#000000' }}
        >
          {card.title}
        </h4>
        
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-primary/10 transition-organic opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Título</label>
                <Input
                  value={editedCard.title}
                  onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                  placeholder="Digite o título da tarefa"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <Textarea
                  value={editedCard.description || ''}
                  onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}
                  placeholder="Descreva a tarefa"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Valor</label>
                  <Input
                    type="number"
                    value={editedCard.value || ''}
                    onChange={(e) => setEditedCard({ 
                      ...editedCard, 
                      value: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <Select
                    value={editedCard.valueType || ''}
                    onValueChange={(value) => setEditedCard({ 
                      ...editedCard, 
                      valueType: value as Card['valueType'] 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="currency">Monetário (R$)</SelectItem>
                      <SelectItem value="tons">Toneladas (t)</SelectItem>
                      <SelectItem value="hectares">Hectares (ha)</SelectItem>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Prioridade</label>
                <Select
                  value={editedCard.priority || ''}
                  onValueChange={(value) => setEditedCard({ 
                    ...editedCard, 
                    priority: value as Card['priority'] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ColorPicker
                color={titleColor}
                onColorChange={setTitleColor}
                label="Cor do título"
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {card.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Date badge */}
      {(card.startDate || card.endDate) && (
        <div className="mb-3">
          <Badge 
            variant="outline" 
            className={`text-xs ${
              getDateStatus(card.endDate) === 'overdue' 
                ? 'bg-destructive/20 text-destructive-foreground border-destructive/30'
                : getDateStatus(card.endDate) === 'warning'
                ? 'bg-warning/20 text-warning-foreground border-warning/30'
                : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            <CalendarIcon className="w-3 h-3 mr-1" />
            {formatDateRange(card.startDate, card.endDate)}
          </Badge>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {card.value && card.valueType && (
            <Badge variant="secondary" className="text-xs">
              {valueTypeIcons[card.valueType]}
              <span className="ml-1">
                {formatValue(card.value, card.valueType)}
              </span>
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Attachment indicator */}
          {card.attachments && card.attachments.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Paperclip className="w-3 h-3" />
              <span>{card.attachments.length}</span>
            </div>
          )}

          {/* Checklist indicator */}
          {card.checklist && card.checklist.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <CheckSquare className="w-3 h-3" />
              <span>
                {card.checklist.filter(item => item.completed).length}/{card.checklist.length}
              </span>
            </div>
          )}

          {card.priority && (
            <Badge 
              className={`text-xs ${priorityColors[card.priority]}`}
              variant="outline"
            >
              {priorityLabels[card.priority]}
            </Badge>
          )}
        </div>
      </div>
    </div>

    <CardDetailsModal
      card={card}
      isOpen={isDetailsModalOpen}
      onClose={() => setIsDetailsModalOpen(false)}
      onUpdate={onUpdate}
    />
  </>
  );
};