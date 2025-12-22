import { useState } from "react";
import { Card, ChecklistItem, AttachedFile } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileUpload } from "./FileUpload";
import { 
  DollarSign, 
  Scale, 
  MapPin, 
  Percent, 
  Plus, 
  Trash2, 
  Edit3,
  CheckSquare,
  Paperclip,
  Download,
  CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CardDetailsModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Card>) => void;
  onDelete?: () => void;
}

const valueTypeIcons = {
  currency: <DollarSign className="w-4 h-4" />,
  tons: <Scale className="w-4 h-4" />,
  hectares: <MapPin className="w-4 h-4" />,
  percentage: <Percent className="w-4 h-4" />
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

export const CardDetailsModal = ({ card, isOpen, onClose, onUpdate, onDelete }: CardDetailsModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState<Card | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>(card?.attachments || []);

  if (!card) return null;

  const checklist = card.checklist || [];
  const completedItems = checklist.filter(item => item.completed).length;

  const handleEdit = () => {
    setEditedCard({ ...card });
    setAttachments(card.attachments || []);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedCard) {
      const updatedCard = {
        ...editedCard,
        attachments: attachments.length > 0 ? attachments : undefined
      };
      onUpdate(updatedCard);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedCard(null);
    setAttachments(card?.attachments || []);
    setIsEditing(false);
  };

  const handleFilesAdd = (newFiles: AttachedFile[]) => {
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleFileRemove = (fileId: string) => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    const newItem: ChecklistItem = {
      id: `checklist-${Date.now()}`,
      text: newChecklistItem.trim(),
      completed: false
    };

    const updatedChecklist = [...checklist, newItem];
    onUpdate({ checklist: updatedChecklist });
    setNewChecklistItem('');
  };

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    onUpdate({ checklist: updatedChecklist });
  };

  const deleteChecklistItem = (itemId: string) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId);
    onUpdate({ checklist: updatedChecklist });
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

  const cardToShow = isEditing ? editedCard! : card;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{cardToShow.title}</DialogTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Título
                </label>
                <Input
                  value={editedCard?.title || ''}
                  onChange={(e) => setEditedCard(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Descrição
                </label>
                <Textarea
                  value={editedCard?.description || ''}
                  onChange={(e) => setEditedCard(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Valor
                  </label>
                  <Input
                    type="number"
                    value={editedCard?.value || ''}
                    onChange={(e) => setEditedCard(prev => prev ? { 
                      ...prev, 
                      value: e.target.value ? parseFloat(e.target.value) : undefined 
                    } : null)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Tipo
                  </label>
                  <Select
                    value={editedCard?.valueType || ''}
                    onValueChange={(value) => setEditedCard(prev => prev ? { 
                      ...prev, 
                      valueType: value as Card['valueType'] 
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Prioridade
                </label>
                <Select
                  value={editedCard?.priority || ''}
                  onValueChange={(value) => setEditedCard(prev => prev ? { 
                    ...prev, 
                    priority: value as Card['priority'] 
                  } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Data de Início
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editedCard?.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedCard?.startDate ? format(editedCard.startDate, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editedCard?.startDate}
                        onSelect={(date) => setEditedCard(prev => prev ? { ...prev, startDate: date } : null)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Data de Término
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editedCard?.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedCard?.endDate ? format(editedCard.endDate, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editedCard?.endDate}
                        onSelect={(date) => setEditedCard(prev => prev ? { ...prev, endDate: date } : null)}
                        initialFocus
                        disabled={(date) => editedCard?.startDate ? date < editedCard.startDate : false}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Anexos
                </label>
                <FileUpload
                  attachments={attachments}
                  onFilesAdd={handleFilesAdd}
                  onFileRemove={handleFileRemove}
                />
              </div>

              <div className="flex justify-between">
                {onDelete && (
                  <Button variant="destructive" onClick={onDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
                <div className="flex space-x-2 ml-auto">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Card Info */}
              <div className="space-y-4">
                {cardToShow.description && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Descrição</h4>
                    <p className="text-muted-foreground">{cardToShow.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {cardToShow.value && cardToShow.valueType && (
                    <Badge variant="secondary" className="text-sm">
                      {valueTypeIcons[cardToShow.valueType]}
                      <span className="ml-2">
                        {formatValue(cardToShow.value, cardToShow.valueType)}
                      </span>
                    </Badge>
                  )}

                  {cardToShow.priority && (
                    <Badge 
                      className={`text-sm ${priorityColors[cardToShow.priority]}`}
                      variant="outline"
                    >
                      {priorityLabels[cardToShow.priority]}
                    </Badge>
                  )}

                  {(cardToShow.startDate || cardToShow.endDate) && (
                    <Badge variant="outline" className="text-sm">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      {cardToShow.startDate && cardToShow.endDate ? (
                        `${format(cardToShow.startDate, 'dd/MM')} - ${format(cardToShow.endDate, 'dd/MM')}`
                      ) : cardToShow.startDate ? (
                        format(cardToShow.startDate, 'dd/MM/yyyy')
                      ) : (
                        `Até ${format(cardToShow.endDate!, 'dd/MM/yyyy')}`
                      )}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    <h4 className="text-sm font-medium text-foreground">
                      Lista de Verificação
                    </h4>
                    {checklist.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {completedItems}/{checklist.length}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 group">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          updateChecklistItem(item.id, { completed: checked as boolean })
                        }
                      />
                      <span 
                        className={`flex-1 text-sm ${
                          item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteChecklistItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Adicionar item à lista..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistItem();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addChecklistItem}
                    disabled={!newChecklistItem.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Attachments */}
              {cardToShow.attachments && cardToShow.attachments.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Paperclip className="w-5 h-5 text-primary" />
                    <h4 className="text-sm font-medium text-foreground">
                      Anexos ({cardToShow.attachments.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {cardToShow.attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {(file.size / 1024).toFixed(0)}KB
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {file.uploadedAt.toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Criado em: {card.createdAt.toLocaleDateString('pt-BR')}</p>
                  <p>Atualizado em: {card.updatedAt.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};