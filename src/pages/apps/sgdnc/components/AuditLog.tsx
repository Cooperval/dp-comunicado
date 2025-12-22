import { Eye, Edit, Download, Clock, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  tipo: 'visualizacao' | 'edicao' | 'download';
  usuario: string;
  data: string;
  detalhes?: string;
}

interface AuditLogProps {
  logs: AuditLogEntry[];
}

export function AuditLog({ logs }: AuditLogProps) {
  const getIcon = (tipo: AuditLogEntry['tipo']) => {
    switch (tipo) {
      case 'visualizacao':
        return <Eye className="h-4 w-4" />;
      case 'edicao':
        return <Edit className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: AuditLogEntry['tipo']) => {
    switch (tipo) {
      case 'visualizacao':
        return 'Visualizou';
      case 'edicao':
        return 'Editou';
      case 'download':
        return 'Baixou';
    }
  };

  const getTipoVariant = (tipo: AuditLogEntry['tipo']): 'default' | 'secondary' | 'outline' => {
    switch (tipo) {
      case 'visualizacao':
        return 'outline';
      case 'edicao':
        return 'default';
      case 'download':
        return 'secondary';
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 p-4">
        {logs.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhuma atividade registrada
          </div>
        ) : (
          logs
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">{getIcon(log.tipo)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getTipoVariant(log.tipo)} className="text-xs">
                      {getTipoLabel(log.tipo)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{log.usuario}</span>
                  </div>
                  {log.detalhes && (
                    <p className="text-xs text-muted-foreground">{log.detalhes}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(log.data), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </ScrollArea>
  );
}
