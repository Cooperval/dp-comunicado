import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Clock, CheckCircle, Pen, Key } from 'lucide-react';
import { getTreinamentoById, confirmarLeitura } from '@/pages/apps/sgdnc/services/sgdncMockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';

export default function ConfirmacaoLeitura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [treinamento, setTreinamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [confirmado, setConfirmado] = useState(false);
  const [metodoConfirmacao, setMetodoConfirmacao] = useState<'assinatura' | 'senha'>('assinatura');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  const sigCanvas = useRef<SignatureCanvas>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const carregarTreinamento = async () => {
      if (!id) return;
      try {
        const data = await getTreinamentoById(id);
        setTreinamento(data);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do treinamento.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    carregarTreinamento();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTempoDecorrido(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const tempoMinimoAtingido = treinamento?.tempoMinimo
    ? tempoDecorrido >= treinamento.tempoMinimo * 60
    : true;

  const progressoTempo = treinamento?.tempoMinimo
    ? Math.min((tempoDecorrido / (treinamento.tempoMinimo * 60)) * 100, 100)
    : 100;

  const assinaturaValida = metodoConfirmacao === 'assinatura'
    ? sigCanvas.current && !sigCanvas.current.isEmpty()
    : senha.length >= 6;

  const podeConfirmar = confirmado && tempoMinimoAtingido && assinaturaValida;

  const handleLimparAssinatura = () => {
    sigCanvas.current?.clear();
  };

  const handleConfirmar = async () => {
    if (!podeConfirmar || !id) return;

    setEnviando(true);
    try {
      let assinatura: string | undefined;
      
      if (metodoConfirmacao === 'assinatura' && sigCanvas.current) {
        assinatura = sigCanvas.current.toDataURL();
      }

      await confirmarLeitura(id, {
        usuarioId: 'current-user',
        data: new Date().toISOString(),
        assinatura,
        tempoLeitura: tempoDecorrido,
      });

      toast({
        title: 'Leitura confirmada',
        description: 'Sua confirmação foi registrada com sucesso.',
      });

      navigate('/apps/sgdnc/treinamentos');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a confirmação.',
        variant: 'destructive',
      });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!treinamento) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Treinamento não encontrado</h2>
          <Button onClick={() => navigate('/apps/sgdnc/treinamentos')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/apps/sgdnc/treinamentos')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{treinamento.titulo}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(treinamento.data), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </p>
        </div>
      </div>

      {/* Tempo de Leitura */}
      {treinamento.tempoMinimo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Tempo de Leitura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Tempo decorrido: {formatTempo(tempoDecorrido)}</span>
              <span>
                Tempo mínimo: {treinamento.tempoMinimo} minuto
                {treinamento.tempoMinimo !== 1 ? 's' : ''}
              </span>
            </div>
            <Progress value={progressoTempo} className="h-2" />
            {!tempoMinimoAtingido && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Você precisa permanecer nesta página por pelo menos{' '}
                  {treinamento.tempoMinimo} minutos antes de confirmar a leitura.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview do Documento/Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo do Treinamento</CardTitle>
        </CardHeader>
        <CardContent>
          {treinamento.tipo === 'video' ? (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Player de vídeo (não implementado no mock)
              </p>
            </div>
          ) : treinamento.tipo === 'leitura-documento' && treinamento.documentoId ? (
            <div className="aspect-[8.5/11] bg-muted rounded-lg flex items-center justify-center">
              <iframe
                src={`/api/documents/${treinamento.documentoId}`}
                className="w-full h-full rounded-lg"
                title="Documento"
              />
            </div>
          ) : (
            <div className="prose max-w-none">
              <p>{treinamento.conteudo || 'Conteúdo do treinamento...'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmação */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmação de Leitura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Checkbox de confirmação */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirmacao"
              checked={confirmado}
              onCheckedChange={(checked) => setConfirmado(checked as boolean)}
              disabled={!tempoMinimoAtingido}
            />
            <div className="space-y-1">
              <Label
                htmlFor="confirmacao"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Li e compreendi o conteúdo *
              </Label>
              <p className="text-sm text-muted-foreground">
                Declaro que li todo o material e compreendi as informações apresentadas.
              </p>
            </div>
          </div>

          {/* Método de Autenticação */}
          <div className="space-y-4">
            <Label>Autenticação</Label>
            <Tabs
              value={metodoConfirmacao}
              onValueChange={(value) => setMetodoConfirmacao(value as 'assinatura' | 'senha')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assinatura">
                  <Pen className="h-4 w-4 mr-2" />
                  Assinatura Digital
                </TabsTrigger>
                <TabsTrigger value="senha">
                  <Key className="h-4 w-4 mr-2" />
                  Senha
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assinatura" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-1 bg-background">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: 'w-full h-40 bg-background rounded cursor-crosshair',
                    }}
                    penColor="hsl(var(--foreground))"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Assine no espaço acima usando o mouse ou tela touch
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLimparAssinatura}
                  >
                    Limpar
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="senha" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha de Confirmação *</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Digite sua senha para confirmar a leitura (mínimo 6 caracteres)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Botão de Confirmação */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/apps/sgdnc/treinamentos')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={!podeConfirmar || enviando}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {enviando ? 'Confirmando...' : 'Confirmar Leitura'}
            </Button>
          </div>

          {/* Validação Visual */}
          {!tempoMinimoAtingido && (
            <Alert variant="destructive">
              <AlertDescription>
                ⏱️ Aguarde o tempo mínimo de leitura
              </AlertDescription>
            </Alert>
          )}
          {!confirmado && tempoMinimoAtingido && (
            <Alert>
              <AlertDescription>
                ☑️ Marque a confirmação de que leu e compreendeu o conteúdo
              </AlertDescription>
            </Alert>
          )}
          {!assinaturaValida && confirmado && tempoMinimoAtingido && (
            <Alert>
              <AlertDescription>
                {metodoConfirmacao === 'assinatura'
                  ? '✍️ Adicione sua assinatura digital'
                  : '🔑 Digite sua senha de confirmação'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
