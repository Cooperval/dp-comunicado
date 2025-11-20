import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CalendarioMes from './components/CalendarioMes';
import CalendarioSemana from './components/CalendarioSemana';
import CalendarioDia from './components/CalendarioDia';
import CompromissoDialog from './components/CompromissoDialog';
import FiltrosAgenda from './components/FiltrosAgenda';
import GerenciarCategorias from './components/GerenciarCategorias';
import { getCompromissosPorMes, getCompromissosPorSemana, getCompromissosPorDia, filtrarCompromissos, buscarCompromissos } from '@/services/agendaLocalStorage';

type VisualizacaoTipo = 'mes' | 'semana' | 'dia';

export default function Dashboard() {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<VisualizacaoTipo>('mes');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dataInicialDialog, setDataInicialDialog] = useState<Date | undefined>();
  const [busca, setBusca] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [status, setStatus] = useState<'todos' | 'pendentes' | 'concluidos'>('todos');

  // Compromissos filtrados
  const compromissosFiltrados = useMemo(() => {
    let compromissos = 
      visualizacao === 'mes' ? getCompromissosPorMes(dataAtual) :
      visualizacao === 'semana' ? getCompromissosPorSemana(dataAtual) :
      getCompromissosPorDia(dataAtual);

    if (busca) {
      compromissos = buscarCompromissos(busca).filter(c => {
        if (visualizacao === 'mes') {
          return getCompromissosPorMes(dataAtual).some(comp => comp.id === c.id);
        } else if (visualizacao === 'semana') {
          return getCompromissosPorSemana(dataAtual).some(comp => comp.id === c.id);
        } else {
          return getCompromissosPorDia(dataAtual).some(comp => comp.id === c.id);
        }
      });
    }

    return filtrarCompromissos(compromissos, categoriasSelecionadas.length > 0 ? categoriasSelecionadas : undefined, status);
  }, [dataAtual, visualizacao, busca, categoriasSelecionadas, status]);

  const handleAnterior = () => {
    if (visualizacao === 'mes') {
      setDataAtual(subMonths(dataAtual, 1));
    } else if (visualizacao === 'semana') {
      setDataAtual(subWeeks(dataAtual, 1));
    } else {
      setDataAtual(subDays(dataAtual, 1));
    }
  };

  const handleProximo = () => {
    if (visualizacao === 'mes') {
      setDataAtual(addMonths(dataAtual, 1));
    } else if (visualizacao === 'semana') {
      setDataAtual(addWeeks(dataAtual, 1));
    } else {
      setDataAtual(addDays(dataAtual, 1));
    }
  };

  const handleHoje = () => {
    setDataAtual(new Date());
  };

  const getTituloPeriodo = () => {
    if (visualizacao === 'mes') {
      return format(dataAtual, 'MMMM yyyy', { locale: ptBR });
    } else if (visualizacao === 'semana') {
      return `Semana de ${format(dataAtual, 'dd MMM', { locale: ptBR })}`;
    } else {
      return format(dataAtual, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  const handleNovoCompromisso = (data?: Date) => {
    setDataInicialDialog(data);
    setDialogAberto(true);
  };

  const handleDiaClick = (data: Date) => {
    setDataAtual(data);
    setVisualizacao('dia');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Minha Agenda</h1>
            <Button onClick={() => handleNovoCompromisso()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Compromisso
            </Button>
          </div>

          {/* Navegação e Controles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleAnterior}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleHoje}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={handleProximo}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="ml-4 font-semibold text-lg capitalize">{getTituloPeriodo()}</div>
            </div>

            <div className="flex gap-2">
              <Tabs value={visualizacao} onValueChange={(v) => setVisualizacao(v as VisualizacaoTipo)}>
                <TabsList>
                  <TabsTrigger value="mes">Mês</TabsTrigger>
                  <TabsTrigger value="semana">Semana</TabsTrigger>
                  <TabsTrigger value="dia">Dia</TabsTrigger>
                </TabsList>
              </Tabs>
              <GerenciarCategorias />
            </div>
          </div>

          {/* Filtros */}
          <FiltrosAgenda
            busca={busca}
            onBuscaChange={setBusca}
            categoriasSelecionadas={categoriasSelecionadas}
            onCategoriasChange={setCategoriasSelecionadas}
            status={status}
            onStatusChange={setStatus}
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-6">
        {visualizacao === 'mes' && (
          <CalendarioMes data={dataAtual} onDiaClick={handleDiaClick} />
        )}
        {visualizacao === 'semana' && (
          <CalendarioSemana data={dataAtual} onNovoCompromisso={handleNovoCompromisso} />
        )}
        {visualizacao === 'dia' && (
          <CalendarioDia data={dataAtual} onNovoCompromisso={handleNovoCompromisso} />
        )}
      </div>

      <CompromissoDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        dataInicial={dataInicialDialog}
      />
    </div>
  );
}
