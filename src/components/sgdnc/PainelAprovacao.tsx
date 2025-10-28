import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PainelAprovacaoProps {
  onAprovar: (comentario: string) => void;
  onRejeitar: (comentario: string) => void;
  onSolicitarRevisao: (comentario: string) => void;
  loading?: boolean;
}

export function PainelAprovacao({
  onAprovar,
  onRejeitar,
  onSolicitarRevisao,
  loading = false,
}: PainelAprovacaoProps) {
  const [comentario, setComentario] = useState('');
  const [dialogAberto, setDialogAberto] = useState<'aprovar' | 'rejeitar' | 'revisar' | null>(null);

  const handleAcao = () => {
    if (dialogAberto === 'aprovar') {
      onAprovar(comentario);
    } else if (dialogAberto === 'rejeitar') {
      onRejeitar(comentario);
    } else if (dialogAberto === 'revisar') {
      onSolicitarRevisao(comentario);
    }
    setComentario('');
    setDialogAberto(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ações de Aprovação</CardTitle>
          <CardDescription>
            Revise o documento e tome uma decisão sobre sua aprovação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              placeholder="Adicione suas observações sobre o documento..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="min-h-[100px] mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comentario.length} / 1000 caracteres
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setDialogAberto('aprovar')}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/80"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar Documento
            </Button>

            <Button
              onClick={() => setDialogAberto('revisar')}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Solicitar Revisão
            </Button>

            <Button
              onClick={() => setDialogAberto('rejeitar')}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={dialogAberto !== null} onOpenChange={() => setDialogAberto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAberto === 'aprovar' && 'Confirmar Aprovação'}
              {dialogAberto === 'rejeitar' && 'Confirmar Rejeição'}
              {dialogAberto === 'revisar' && 'Solicitar Revisão'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAberto === 'aprovar' &&
                'Você está prestes a aprovar este documento. Esta ação registrará sua aprovação no histórico.'}
              {dialogAberto === 'rejeitar' &&
                'Você está prestes a rejeitar este documento. O analista será notificado e o documento não será publicado.'}
              {dialogAberto === 'revisar' &&
                'Você está solicitando revisão do documento. O analista será notificado para fazer as alterações necessárias.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcao}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
