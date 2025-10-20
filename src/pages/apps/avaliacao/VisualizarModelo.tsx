import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Eye } from 'lucide-react';
import { mockAPI } from '@/services/mockData';
import { Badge } from '@/components/ui/badge';

export default function VisualizarModelo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modelo, setModelo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelo();
  }, [id]);

  const loadModelo = async () => {
    setLoading(true);
    const data = await mockAPI.getModeloAvaliacaoById(id!);
    setModelo(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="animate-fade-in">Carregando...</div>;
  }

  if (!modelo) {
    return <div>Modelo não encontrado</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Prévia do Modelo</h1>
              <p className="text-muted-foreground mt-1">
                Visualização de como o gestor verá esta avaliação
              </p>
            </div>
          </div>
        </div>
        <Badge variant={modelo.ativo ? 'default' : 'secondary'} className="text-sm">
          {modelo.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-2xl">{modelo.titulo}</CardTitle>
          {modelo.descricao && (
            <p className="text-muted-foreground mt-2">{modelo.descricao}</p>
          )}
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {modelo.perguntas.map((pergunta: any, index: number) => (
          <Card key={pergunta.id || index}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">
                      {pergunta.titulo}
                      {pergunta.obrigatoria && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                  </div>
                  {pergunta.descricao && (
                    <p className="text-sm text-muted-foreground">{pergunta.descricao}</p>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {pergunta.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Descritiva'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pergunta.tipo === 'multipla_escolha' ? (
                <RadioGroup disabled className="space-y-3">
                  {pergunta.opcoes?.map((opcao: any, opIndex: number) => (
                    <div
                      key={opIndex}
                      className="flex items-center space-x-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem
                        value={opcao.valor.toString()}
                        id={`${pergunta.id}-${opIndex}`}
                      />
                      <Label
                        htmlFor={`${pergunta.id}-${opIndex}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">{opcao.valor}</span>
                          <span>-</span>
                          <span>{opcao.texto}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  disabled
                  placeholder="O gestor digitará a resposta aqui..."
                  rows={4}
                  className="resize-none"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          <p>
            Total de perguntas: <span className="font-semibold">{modelo.perguntas.length}</span>
          </p>
          <p>
            Obrigatórias:{' '}
            <span className="font-semibold">
              {modelo.perguntas.filter((p: any) => p.obrigatoria).length}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <Button onClick={() => navigate(`/apps/avaliacao/modelos/editar/${modelo.id}`)}>
            Editar Modelo
          </Button>
        </div>
      </div>
    </div>
  );
}
