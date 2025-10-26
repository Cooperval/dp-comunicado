import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilterAdvancedPopoverProps {
  filtros: {
    dataInicio: Date | null;
    dataFim: Date | null;
    autor: string;
    status: string;
  };
  onFiltrosChange: (filtros: any) => void;
  autores: string[];
}

export function FilterAdvancedPopover({
  filtros,
  onFiltrosChange,
  autores,
}: FilterAdvancedPopoverProps) {
  const [open, setOpen] = useState(false);

  const countFiltrosAtivos = () => {
    let count = 0;
    if (filtros.dataInicio) count++;
    if (filtros.dataFim) count++;
    if (filtros.autor) count++;
    if (filtros.status) count++;
    return count;
  };

  const limparFiltros = () => {
    onFiltrosChange({
      dataInicio: null,
      dataFim: null,
      autor: '',
      status: '',
    });
  };

  const filtrosAtivos = countFiltrosAtivos();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
          {filtrosAtivos > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {filtrosAtivos}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filtros Avançados</h4>
            {filtrosAtivos > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="h-auto p-1 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data de Criação (Início)</Label>
            <Calendar
              mode="single"
              selected={filtros.dataInicio || undefined}
              onSelect={(date) =>
                onFiltrosChange({ ...filtros, dataInicio: date || null })
              }
              locale={ptBR}
              className="rounded-md border pointer-events-auto"
            />
            {filtros.dataInicio && (
              <p className="text-xs text-muted-foreground">
                De: {format(filtros.dataInicio, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data de Criação (Fim)</Label>
            <Calendar
              mode="single"
              selected={filtros.dataFim || undefined}
              onSelect={(date) =>
                onFiltrosChange({ ...filtros, dataFim: date || null })
              }
              locale={ptBR}
              className="rounded-md border pointer-events-auto"
              disabled={(date) =>
                filtros.dataInicio ? date < filtros.dataInicio : false
              }
            />
            {filtros.dataFim && (
              <p className="text-xs text-muted-foreground">
                Até: {format(filtros.dataFim, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Autor</Label>
            <Select
              value={filtros.autor}
              onValueChange={(value) =>
                onFiltrosChange({ ...filtros, autor: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os autores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os autores</SelectItem>
                {autores.map((autor) => (
                  <SelectItem key={autor} value={autor}>
                    {autor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filtros.status}
              onValueChange={(value) =>
                onFiltrosChange({ ...filtros, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
