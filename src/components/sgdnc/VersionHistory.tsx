import { Clock, User, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Versao } from '@/services/sgdncMockData';

interface VersionHistoryProps {
  versoes: Versao[];
  versaoAtual: number;
  onRestore?: (versao: number) => void;
  isAdmin?: boolean;
}

export function VersionHistory({ versoes, versaoAtual, onRestore, isAdmin }: VersionHistoryProps) {
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 p-4">
        {versoes
          .sort((a, b) => b.numero - a.numero)
          .map((versao, index) => (
            <div key={versao.numero}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={versao.numero === versaoAtual ? 'default' : 'secondary'}>
                      v{versao.numero}
                    </Badge>
                    {versao.numero === versaoAtual && (
                      <Badge variant="outline" className="text-xs">
                        Atual
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Baixar versão"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {isAdmin && versao.numero !== versaoAtual && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onRestore?.(versao.numero)}
                        title="Restaurar versão"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-sm">{versao.comentario}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{versao.criadoPor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(versao.criadoEm), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Arquivo: {versao.arquivo}
                </div>
              </div>

              {index < versoes.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
      </div>
    </ScrollArea>
  );
}
