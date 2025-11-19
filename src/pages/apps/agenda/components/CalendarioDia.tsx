import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCompromissosPorDia, getEstatisticasDia, toggleConcluido } from '@/services/agendaLocalStorage';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Pencil, Trash2 } from 'lucide-react';
import CompromissoDialog from './CompromissoDialog';
import { toast } from 'sonner';
import { deleteCompromisso, Compromisso } from '@/services/agendaLocalStorage';

interface CalendarioDiaProps {
  data: Date;
  onNovoCompromisso: (data?: Date) => void;
}

export default function CalendarioDia({ data, onNovoCompromisso }: CalendarioDiaProps) {
  const [compromissos, setCompromissos] = useState(() => getCompromissosPorDia(data));
  const [dialogAberto, setDialogAberto] = useState(false);
  const [compromissoEditando, setCompromissoEditando] = useState<Compromisso | undefined>();

  const estatisticas = useMemo(() => getEstatisticasDia(data), [data, compromissos]);

  const horas = Array.from({ length: 24 }, (_, i) => i);

  const getCompromissosNaHora = (hora: number) => {
    return compromissos.filter((c) => {
      const [h] = c.horaInicio.split(':').map(Number);
      return h === hora;
    });
  };

  const handleToggleConcluido = (id: string) => {
    toggleConcluido(id);
    setCompromissos(getCompromissosPorDia(data));
    toast.success('Status atualizado');
  };

  const handleEditar = (comp: Compromisso) => {
    setCompromissoEditando(comp);
    setDialogAberto(true);
  };

  const handleExcluir = (id: string) => {
    if (confirm('Deseja excluir este compromisso?')) {
      deleteCompromisso(id);
      setCompromissos(getCompromissosPorDia(data));
      toast.success('Compromisso excluído');
    }
  };

  const handleDialogClose = () => {
    setDialogAberto(false);
    setCompromissoEditando(undefined);
    setCompromissos(getCompromissosPorDia(data));
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total de Compromissos</div>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Horas Ocupadas</div>
            <div className="text-2xl font-bold">{estatisticas.horas}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Concluídos</div>
            <div className="text-2xl font-bold">
              {estatisticas.concluidos}/{estatisticas.total}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de horários */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {horas.map((hora) => {
              const compromissosNaHora = getCompromissosNaHora(hora);
              const horaStr = String(hora).padStart(2, '0');

              return (
                <div key={hora} className="flex">
                  <div className="w-20 p-4 text-sm text-muted-foreground font-medium border-r">
                    {horaStr}:00
                  </div>
                  <div className="flex-1 p-2">
                    {compromissosNaHora.length > 0 ? (
                      <div className="space-y-2">
                        {compromissosNaHora.map((comp) => (
                          <div
                            key={comp.id}
                            className="p-4 rounded-lg border"
                            style={{ borderLeftWidth: '4px', borderLeftColor: comp.cor }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <Checkbox
                                  checked={comp.concluido}
                                  onCheckedChange={() => handleToggleConcluido(comp.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <h3 className={`font-semibold ${comp.concluido ? 'line-through text-muted-foreground' : ''}`}>
                                    {comp.titulo}
                                  </h3>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {comp.horaInicio} - {comp.horaFim}
                                    </div>
                                    {comp.local && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {comp.local}
                                      </div>
                                    )}
                                  </div>
                                  {comp.descricao && (
                                    <p className="mt-2 text-sm text-muted-foreground">{comp.descricao}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditar(comp)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExcluir(comp.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => onNovoCompromisso(data)}
                        className="w-full h-16 hover:bg-accent rounded transition-colors text-sm text-muted-foreground"
                      >
                        Clique para adicionar compromisso
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CompromissoDialog
        open={dialogAberto}
        onOpenChange={handleDialogClose}
        compromisso={compromissoEditando}
        dataInicial={data}
      />
    </div>
  );
}
