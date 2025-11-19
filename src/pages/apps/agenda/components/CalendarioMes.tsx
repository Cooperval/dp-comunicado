import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCompromissosPorMes } from '@/services/agendaLocalStorage';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CalendarioMesProps {
  data: Date;
  onDiaClick: (data: Date) => void;
}

export default function CalendarioMes({ data, onDiaClick }: CalendarioMesProps) {
  const compromissos = useMemo(() => getCompromissosPorMes(data), [data]);

  const diasDoMes = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(data), { weekStartsOn: 0 });
    const fim = endOfWeek(endOfMonth(data), { weekStartsOn: 0 });

    const dias = [];
    let diaAtual = inicio;

    while (diaAtual <= fim) {
      dias.push(diaAtual);
      diaAtual = addDays(diaAtual, 1);
    }

    return dias;
  }, [data]);

  const getCompromissosDoDia = (dia: Date) => {
    const dataStr = format(dia, 'yyyy-MM-dd');
    return compromissos.filter((c) => c.data === dataStr);
  };

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hoje = new Date();

  return (
    <div className="bg-card rounded-lg border">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 border-b">
        {diasDaSemana.map((dia) => (
          <div key={dia} className="p-4 text-center font-semibold text-muted-foreground">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7">
        {diasDoMes.map((dia, index) => {
          const compromissosDia = getCompromissosDoDia(dia);
          const isHoje = isSameDay(dia, hoje);
          const isMesAtual = isSameMonth(dia, data);

          return (
            <div
              key={index}
              onClick={() => onDiaClick(dia)}
              className={cn(
                'min-h-24 p-2 border-b border-r cursor-pointer hover:bg-accent transition-colors',
                !isMesAtual && 'bg-muted/30 text-muted-foreground',
                index % 7 === 6 && 'border-r-0'
              )}
            >
              <div className="flex flex-col h-full">
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isHoje && 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center'
                  )}
                >
                  {format(dia, 'd')}
                </div>

                {/* Indicadores de compromissos */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {compromissosDia.slice(0, 3).map((comp) => (
                    <div
                      key={comp.id}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: comp.cor }}
                      title={comp.titulo}
                    />
                  ))}
                  {compromissosDia.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{compromissosDia.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
