import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategorias, createCompromisso, updateCompromisso, Compromisso, verificarConflito } from '@/services/agendaLocalStorage';
import { toast } from 'sonner';

interface CompromissoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compromisso?: Compromisso;
  dataInicial?: Date;
}

export default function CompromissoDialog({ open, onOpenChange, compromisso, dataInicial }: CompromissoDialogProps) {
  const [categorias] = useState(() => getCategorias());
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState<Date | undefined>();
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFim, setHoraFim] = useState('10:00');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');

  useEffect(() => {
    if (compromisso) {
      setTitulo(compromisso.titulo);
      setData(new Date(compromisso.data));
      setHoraInicio(compromisso.horaInicio);
      setHoraFim(compromisso.horaFim);
      setCategoria(compromisso.categoria);
      setDescricao(compromisso.descricao || '');
      setLocal(compromisso.local || '');
    } else {
      setTitulo('');
      setData(dataInicial || new Date());
      setHoraInicio('09:00');
      setHoraFim('10:00');
      setCategoria(categorias[0]?.nome || '');
      setDescricao('');
      setLocal('');
    }
  }, [compromisso, dataInicial, categorias, open]);

  const handleSalvar = () => {
    if (!titulo.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (!data) {
      toast.error('A data é obrigatória');
      return;
    }

    if (horaInicio >= horaFim) {
      toast.error('A hora de fim deve ser após a hora de início');
      return;
    }

    const categoriaObj = categorias.find((c) => c.nome === categoria);
    if (!categoriaObj) {
      toast.error('Categoria inválida');
      return;
    }

    const dataStr = format(data, 'yyyy-MM-dd');

    const dadosCompromisso = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      data: dataStr,
      horaInicio,
      horaFim,
      categoria: categoriaObj.nome,
      cor: categoriaObj.cor,
      local: local.trim(),
      concluido: compromisso?.concluido || false,
    };

    // Verificar conflitos
    const conflitos = verificarConflito(dadosCompromisso, compromisso?.id);
    if (conflitos.length > 0) {
      const confirmar = confirm(
        `Este horário conflita com:\n${conflitos.map((c) => `- ${c.titulo} (${c.horaInicio}-${c.horaFim})`).join('\n')}\n\nDeseja continuar?`
      );
      if (!confirmar) return;
    }

    if (compromisso) {
      updateCompromisso(compromisso.id, dadosCompromisso);
      toast.success('Compromisso atualizado');
    } else {
      createCompromisso(dadosCompromisso);
      toast.success('Compromisso criado');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{compromisso ? 'Editar Compromisso' : 'Novo Compromisso'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião com cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !data && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data} onSelect={setData} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora Início *</Label>
              <Input
                id="horaInicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaFim">Hora Fim *</Label>
              <Input id="horaFim" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Sala 3 - Prédio A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione detalhes sobre o compromisso"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
