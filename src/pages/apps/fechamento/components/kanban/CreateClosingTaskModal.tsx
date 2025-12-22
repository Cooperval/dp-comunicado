import { useState } from "react";
import { Card, Column, User } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { hasCircularDependency, calculateStartDate, calculateEndDate, getAllCards } from "@/pages/apps/fechamento/lib/dependencyUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CreateClosingTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'columnId' | 'position'>) => void;
  columns: Column[];
  members: User[];
  baseStartDate: Date;
  editingCard?: Card | null;
}

const priorityOptions = [
  { label: 'Alta', value: 'high', color: 'text-red-500' },
  { label: 'Média', value: 'medium', color: 'text-yellow-500' },
  { label: 'Baixa', value: 'low', color: 'text-green-500' },
];

export const CreateClosingTaskModal = ({
  isOpen,
  onClose,
  onSave,
  columns,
  members,
  baseStartDate,
  editingCard
}: CreateClosingTaskModalProps) => {
  const [title, setTitle] = useState(editingCard?.title || '');
  const [description, setDescription] = useState(editingCard?.description || '');
  const [duration, setDuration] = useState(editingCard?.duration?.toString() || '1');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(editingCard?.priority || 'medium');
  const [assignedToId, setAssignedToId] = useState(editingCard?.assignedTo?.id || '');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(editingCard?.dependsOn || []);

  const allCards = getAllCards(columns).filter(c => c.id !== editingCard?.id);

  const handleDependencyToggle = (cardId: string) => {
    if (editingCard && hasCircularDependency(columns, editingCard.id, cardId)) {
      return; // Don't allow circular dependencies
    }

    setSelectedDependencies(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Calculate preview dates
  const previewCard: Partial<Card> = {
    dependsOn: selectedDependencies,
    duration: parseInt(duration) || 1
  };
  const previewStartDate = calculateStartDate(columns, previewCard as Card, baseStartDate);
  const previewEndDate = calculateEndDate(previewStartDate, parseInt(duration) || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !duration) return;

    const assignedUser = members.find(m => m.id === assignedToId);
    const durationNum = parseInt(duration) || 1;
    const startDate = calculateStartDate(columns, { dependsOn: selectedDependencies } as Card, baseStartDate);
    const endDate = calculateEndDate(startDate, durationNum);

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      duration: durationNum,
      priority,
      assignedTo: assignedUser,
      dependsOn: selectedDependencies.length > 0 ? selectedDependencies : undefined,
      startDate,
      endDate
    });

    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDuration('1');
    setPriority('medium');
    setAssignedToId('');
    setSelectedDependencies([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCard ? 'Editar Tarefa' : 'Nova Tarefa de Fechamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Conciliação Bancária"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a tarefa..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (dias) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v: 'low' | 'medium' | 'high') => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={opt.color}>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {allCards.length > 0 && (
            <div className="space-y-2">
              <Label>Depende de</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto bg-muted/30">
                {allCards.map(card => {
                  const isCircular = editingCard && hasCircularDependency(columns, editingCard.id, card.id);
                  return (
                    <div key={card.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`dep-${card.id}`}
                        checked={selectedDependencies.includes(card.id)}
                        onCheckedChange={() => handleDependencyToggle(card.id)}
                        disabled={isCircular}
                      />
                      <label
                        htmlFor={`dep-${card.id}`}
                        className={`text-sm cursor-pointer ${isCircular ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {card.title}
                        {card.duration && <span className="text-muted-foreground ml-1">({card.duration}d)</span>}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date preview */}
          <div className="bg-muted/50 rounded-md p-3 text-sm">
            <p className="font-medium mb-1">Datas calculadas:</p>
            <p className="text-muted-foreground">
              📅 Início: {format(previewStartDate, "dd/MM/yyyy", { locale: ptBR })}
            </p>
            <p className="text-muted-foreground">
              📅 Término: {format(previewEndDate, "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim() || !duration}>
              {editingCard ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};