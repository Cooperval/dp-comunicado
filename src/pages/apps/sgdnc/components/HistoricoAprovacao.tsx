import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Send, AlertCircle } from 'lucide-react';

export interface HistoricoAprovacao {
  id: string;
  usuario: string;
  cargo: string;
  acao: 'submetido' | 'aprovado' | 'rejeitado' | 'revisao-solicitada';
  comentario?: string;
  data: string;
}

interface HistoricoAprovacaoProps {
  historico: HistoricoAprovacao[];
}

export function HistoricoAprovacao({ historico }: HistoricoAprovacaoProps) {
  const getAcaoIcon = (acao: HistoricoAprovacao['acao']) => {
    switch (acao) {
      case 'submetido':
        return <Send className="h-5 w-5 text-primary" />;
      case 'aprovado':
        return <CheckCircle2 className="h-5 w-5 text-accent" />;
      case 'rejeitado':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'revisao-solicitada':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAcaoLabel = (acao: HistoricoAprovacao['acao']) => {
    switch (acao) {
      case 'submetido':
        return 'Submetido para aprovação';
      case 'aprovado':
        return 'Aprovado';
      case 'rejeitado':
        return 'Rejeitado';
      case 'revisao-solicitada':
        return 'Revisão solicitada';
      default:
        return acao;
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Aprovação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historico.map((item, index) => (
            <div key={item.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {getAcaoIcon(item.acao)}
                </div>
                {index < historico.length - 1 && (
                  <div className="w-px h-full bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-medium">{getAcaoLabel(item.acao)}</p>
                    <p className="text-sm text-muted-foreground">
                      Por: {item.usuario} ({item.cargo})
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatarData(item.data)}
                  </p>
                </div>
                {item.comentario && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">{item.comentario}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
