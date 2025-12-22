import { ProjectionLog } from '@/pages/apps/fluxo-de-caixa/types/projection';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Plus, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityLogProps {
  logs: ProjectionLog[];
}

const getActionIcon = (action: ProjectionLog['action']) => {
  switch (action) {
    case 'create':
      return <Plus className="h-4 w-4 text-accent" />;
    case 'update':
      return <Edit className="h-4 w-4 text-info" />;
    case 'delete':
      return <Trash2 className="h-4 w-4 text-destructive" />;
    default:
      return <History className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActionColor = (action: ProjectionLog['action']) => {
  switch (action) {
    case 'create':
      return 'bg-accent/10 border-accent/20';
    case 'update':
      return 'bg-info/10 border-info/20';
    case 'delete':
      return 'bg-destructive/10 border-destructive/20';
    default:
      return 'bg-muted border-border';
  }
};

const formatValue = (value: string | number | undefined) => {
  if (value === undefined) return '';
  if (typeof value === 'number') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return value;
};

export function ActivityLog({ logs }: ActivityLogProps) {
  console.log('ActivityLog logs:', logs);

  return (
    <div className="bg-card rounded-lg border shadow-soft animate-slide-up">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">Histórico de Atividades</h2>
      </div>

      <ScrollArea className="h-[300px]">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {logs.map((log) => {
              const lines = log.description.split('\n');

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${getActionColor(log.action)} animate-fade-in`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {lines[0]}
                      </p>
                      {lines.slice(1).map((line, i) => (
                        <p key={i} className="text-xs text-muted-foreground mt-1">
                          {line}
                        </p>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
