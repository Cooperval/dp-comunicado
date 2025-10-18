import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { mockAPI } from '@/services/mockData';

export default function RealizarAvaliacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avaliacao, setAvaliacao] = useState<any>(null);
  const [respostas, setRespostas] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadAvaliacao = async () => {
      const data = await mockAPI.getAvaliacaoParaResponder(id!);
      setAvaliacao(data);
    };
    loadAvaliacao();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar perguntas obrigatórias
    const perguntasObrigatorias = avaliacao.modelo.perguntas.filter((p: any) => p.obrigatoria);
    const todasPreenchidas = perguntasObrigatorias.every((p: any) => {
      const resposta = respostas[p.id];
      if (p.tipo === 'multipla_escolha') {
        return resposta !== undefined && resposta !== '';
      }
      return resposta && resposta.trim() !== '';
    });

    if (!todasPreenchidas) {
      toast({
        title: 'Erro',
        description: 'Responda todas as perguntas obrigatórias antes de enviar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await mockAPI.submitAvaliacaoResposta(id!, { respostas });

      toast({
        title: 'Sucesso',
        description: 'Avaliação enviada com sucesso',
      });

      navigate('/apps/avaliacao/lista');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar avaliação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!avaliacao) {
    return <div className="animate-fade-in">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Realizar Avaliação</h1>
          <p className="text-muted-foreground mt-1">
            Avaliando: <strong>{avaliacao.aprendiz}</strong>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Avaliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{avaliacao.modelo.titulo}</h3>
            {avaliacao.modelo.descricao && (
              <p className="text-sm text-muted-foreground mt-1">
                {avaliacao.modelo.descricao}
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Aprendiz</p>
              <p className="font-medium">{avaliacao.aprendiz}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prazo</p>
              <p className="font-medium">{avaliacao.prazo}</p>
            </div>
          </div>
          {avaliacao.observacoes && (
            <div>
              <p className="text-sm text-muted-foreground">Observações do RH</p>
              <p className="text-sm">{avaliacao.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perguntas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {avaliacao.modelo.perguntas.map((pergunta: any, index: number) => (
              <div key={pergunta.id} className="space-y-3 pb-6 border-b last:border-0">
                <div>
                  <h3 className="font-semibold">
                    {index + 1}. {pergunta.titulo}
                    {pergunta.obrigatoria && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </h3>
                  {pergunta.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {pergunta.descricao}
                    </p>
                  )}
                </div>

                {pergunta.tipo === 'multipla_escolha' ? (
                  <RadioGroup
                    value={respostas[pergunta.id]?.toString()}
                    onValueChange={(value) =>
                      setRespostas({ ...respostas, [pergunta.id]: parseInt(value) })
                    }
                  >
                    <div className="grid grid-cols-5 gap-3">
                      {pergunta.opcoes.map((opcao: any) => (
                        <div
                          key={opcao.valor}
                          className="flex flex-col items-center space-y-2"
                        >
                          <RadioGroupItem
                            value={opcao.valor.toString()}
                            id={`${pergunta.id}-${opcao.valor}`}
                          />
                          <Label
                            htmlFor={`${pergunta.id}-${opcao.valor}`}
                            className="text-center text-xs leading-tight cursor-pointer"
                          >
                            {opcao.texto}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={respostas[pergunta.id] || ''}
                    onChange={(e) =>
                      setRespostas({ ...respostas, [pergunta.id]: e.target.value })
                    }
                    rows={4}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
