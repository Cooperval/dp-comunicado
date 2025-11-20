import { startOfWeek, endOfWeek, addDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCompromissosPorSemana } from '@/services/agendaLocalStorage';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import CompromissoCard from './CompromissoCard';

interface CalendarioSemanaProps {
  data: Date;
  onNovoCompromisso: (data?: Date) => void;
}

export default function CalendarioSemana({ data, onNovoCompromisso }: CalendarioSemanaProps) {
  const compromissos = useMemo(() => getCompromissosPorSemana(data), [data]);

  const diasDaSemana = useMemo(() => {
    const inicio = startOfWeek(data, { weekStartsOn: 0 });
    const dias = [];
    for (let i = 0; i < 7; i++) {
      dias.push(addDays(inicio, i));
    }
    return dias;
  }, [data]);

  const horas = Array.from({ length: 24 }, (_, i) => i);
  const hoje = new Date();
  const horaAtual = hoje.getHours();
  const minutoAtual = hoje.getMinutes();
  const isHoje = (dia: Date) => isSameDay(dia, hoje);

  const getCompromissosDoDia = (dia: Date) => {
    const dataStr = format(dia, 'yyyy-MM-dd');
    return compromissos.filter((c) => c.data === dataStr);
  };

  const getPosicaoHorario = (horaInicio: string) => {
    const [hora, minuto] = horaInicio.split(':').map(Number);
    return hora + minuto / 60;
  };

  const getAlturaCompromisso = (horaInicio: string, horaFim: string) => {
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFim.split(':').map(Number);
    const duracaoHoras = (hF * 60 + mF - (hI * 60 + mI)) / 60;
    return duracaoHoras;
  };

  return (
    <div className="bg-card rounded-lg border overflow-auto">
      <div className="grid grid-cols-8 min-w-[800px]">
        {/* Cabeçalho com dias da semana */}
        <div className="sticky top-0 bg-card border-b z-10"></div>
        {diasDaSemana.map((dia) => {
          const isHoje = isSameDay(dia, hoje);
          return (
            <div
              key={dia.toISOString()}
              className={cn(
                'sticky top-0 bg-card border-b border-l p-3 text-center z-10',
                isHoje && 'bg-accent'
              )}
            >
              <div className={cn('text-sm font-medium', isHoje && 'text-primary')}>
                {format(dia, 'EEE', { locale: ptBR })}
              </div>
              <div className={cn('text-2xl font-bold', isHoje && 'text-primary')}>
                {format(dia, 'd')}
              </div>
            </div>
          );
        })}

        {/* Grid de horários */}
        {horas.map((hora) => (
          <>
            {/* Coluna de horário */}
            <div key={`hora-${hora}`} className="border-b border-r p-2 text-right text-sm text-muted-foreground">
              {String(hora).padStart(2, '0')}:00
            </div>

            {/* Colunas dos dias */}
            {diasDaSemana.map((dia) => {
              const compromissosDia = getCompromissosDoDia(dia);
              const compromissosNaHora = compromissosDia.filter((c) => {
                const posicao = getPosicaoHorario(c.horaInicio);
                return Math.floor(posicao) === hora;
              });
              
              const mostrarIndicadorHorario = isHoje(dia) && hora === horaAtual;

              return (
                <div
                  key={`${dia.toISOString()}-${hora}`}
                  className="border-b border-l relative min-h-16 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onNovoCompromisso(dia)}
                >
                  {/* Indicador de horário atual */}
                  {mostrarIndicadorHorario && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${(minutoAtual / 60) * 64}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                      </div>
                    </div>
                  )}

                  {compromissosNaHora.map((comp) => {
                    const posicao = getPosicaoHorario(comp.horaInicio);
                    const topOffset = (posicao - hora) * 64; // 64px = min-h-16
                    const altura = getAlturaCompromisso(comp.horaInicio, comp.horaFim) * 64;

                    return (
                      <div
                        key={comp.id}
                        className="absolute left-0 right-0 px-1"
                        style={{
                          top: `${topOffset}px`,
                          height: `${altura}px`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CompromissoCard compromisso={comp} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
