import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, User, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Versao } from '@/services/sgdncMockData';
import { gerarPDFVersao } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

interface DocumentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versoes: Versao[];
  titulo: string;
  documentoId: string;
}

export function DocumentHistoryDialog({
  open,
  onOpenChange,
  versoes,
  titulo,
  documentoId,
}: DocumentHistoryDialogProps) {
  const navigate = useNavigate();

  const handleDownload = async (versao: Versao) => {
    try {
      // Mock: em produção, buscar documento completo
      toast.info('Gerando PDF...');
      setTimeout(() => {
        toast.success('Download iniciado');
      }, 500);
    } catch (error) {
      toast.error('Erro ao baixar versão');
    }
  };

  const handleVisualizarVersao = (versaoNumero: number) => {
    navigate(`/apps/sgdnc/documentos/${documentoId}/versoes/${versaoNumero}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Versões</DialogTitle>
          <DialogDescription>{titulo}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {versoes
              .sort((a, b) => b.numero - a.numero)
              .map((versao, index) => (
                <div
                  key={versao.numero}
                  className="flex gap-4 pb-4 border-b border-border last:border-0"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index === 0
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {versao.numero}
                    </div>
                    {index < versoes.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          v{versao.numero}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Atual
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVisualizarVersao(versao.numero)}
                          title="Visualizar conteúdo"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(versao)}
                          title="Baixar versão"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{versao.comentario}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{versao.criadoPor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(versao.criadoEm).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
