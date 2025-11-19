import { Compromisso } from '@/services/agendaLocalStorage';
import { Card } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompromissoCardProps {
  compromisso: Compromisso;
}

export default function CompromissoCard({ compromisso }: CompromissoCardProps) {
  return (
    <Card
      className={cn(
        'h-full overflow-hidden cursor-pointer hover:shadow-md transition-shadow',
        compromisso.concluido && 'opacity-60'
      )}
      style={{ borderLeftWidth: '4px', borderLeftColor: compromisso.cor }}
    >
      <div className="p-2 h-full flex flex-col">
        <h4 className={cn('font-semibold text-sm line-clamp-2', compromisso.concluido && 'line-through')}>
          {compromisso.titulo}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {compromisso.horaInicio} - {compromisso.horaFim}
        </div>
        {compromisso.local && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground line-clamp-1">
            <MapPin className="h-3 w-3" />
            {compromisso.local}
          </div>
        )}
      </div>
    </Card>
  );
}
