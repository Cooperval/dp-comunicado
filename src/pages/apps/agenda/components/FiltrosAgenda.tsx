import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategorias } from '@/services/agendaLocalStorage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FiltrosAgendaProps {
  busca: string;
  onBuscaChange: (busca: string) => void;
  categoriasSelecionadas: string[];
  onCategoriasChange: (categorias: string[]) => void;
  status: 'todos' | 'pendentes' | 'concluidos';
  onStatusChange: (status: 'todos' | 'pendentes' | 'concluidos') => void;
}

export default function FiltrosAgenda({
  busca,
  onBuscaChange,
  categoriasSelecionadas,
  onCategoriasChange,
  status,
  onStatusChange,
}: FiltrosAgendaProps) {
  const categorias = getCategorias();
  const temFiltrosAtivos = categoriasSelecionadas.length > 0 || status !== 'todos';

  const toggleCategoria = (categoriaId: string) => {
    if (categoriasSelecionadas.includes(categoriaId)) {
      onCategoriasChange(categoriasSelecionadas.filter((id) => id !== categoriaId));
    } else {
      onCategoriasChange([...categoriasSelecionadas, categoriaId]);
    }
  };

  const limparFiltros = () => {
    onCategoriasChange([]);
    onStatusChange('todos');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Busca */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar compromissos..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtro de Status */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="pendentes">Pendentes</SelectItem>
          <SelectItem value="concluidos">Concluídos</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro de Categorias */}
      <div className="flex flex-wrap gap-2 items-center">
        {categorias.map((cat) => {
          const selecionada = categoriasSelecionadas.includes(cat.id);
          return (
            <Badge
              key={cat.id}
              variant={selecionada ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              style={selecionada ? { backgroundColor: cat.cor, borderColor: cat.cor } : {}}
              onClick={() => toggleCategoria(cat.id)}
            >
              {cat.nome}
            </Badge>
          );
        })}
      </div>

      {/* Limpar Filtros */}
      {temFiltrosAtivos && (
        <Button variant="ghost" size="sm" onClick={limparFiltros}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
