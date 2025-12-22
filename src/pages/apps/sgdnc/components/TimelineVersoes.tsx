import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Versao } from '@/services/sgdncMockData';

interface TimelineVersoesProps {
  versoes: Versao[];
  versaoAtual: number;
  onVisualizarVersao: (versao: number) => void;
  onDownloadVersao: (versao: number) => void;
}

export function TimelineVersoes({ 
  versoes, 
  versaoAtual, 
  onVisualizarVersao,
  onDownloadVersao 
}: TimelineVersoesProps) {
  const versoesOrdenadas = [...versoes].sort((a, b) => b.numero - a.numero);

  return (
    <div className="relative">
      {/* Linha vertical da timeline */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-8">
        {versoesOrdenadas.map((versao, index) => {
          const isAtual = versao.numero === versaoAtual;
          
          return (
            <div key={versao.numero} className="relative flex gap-4 items-start">
              {/* Ponto da timeline */}
              <div className={`
                relative z-10 flex items-center justify-center
                w-16 h-16 rounded-full border-4 border-background
                ${isAtual 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'}
              `}>
                <span className="font-bold">v{versao.numero}</span>
              </div>

              {/* Conteúdo da versão */}
              <div className="flex-1 pb-8">
                <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Versão {versao.numero}</h3>
                        {isAtual && (
                          <Badge>Atual</Badge>
                        )}
                        {index === 0 && !isAtual && (
                          <Badge variant="outline">Mais Recente</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {versao.comentario}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>👤 {versao.criadoPor}</span>
                        <span>
                          📅 {format(new Date(versao.criadoEm), "dd/MM/yyyy 'às' HH:mm", { 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onVisualizarVersao(versao.numero)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadVersao(versao.numero)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Informações adicionais */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Arquivo: {versao.arquivo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
