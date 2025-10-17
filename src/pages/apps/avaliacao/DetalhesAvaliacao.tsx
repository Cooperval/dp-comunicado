import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { mockAPI } from '@/services/mockData';

export default function DetalhesAvaliacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [avaliacao, setAvaliacao] = useState<any>(null);

  useEffect(() => {
    const loadDetalhes = async () => {
      const data = await mockAPI.getAvaliacaoDetalhes(id!);
      setAvaliacao(data);
    };
    loadDetalhes();
  }, [id]);

  if (!avaliacao) {
    return <div className="animate-fade-in">Carregando...</div>;
  }

  const notasArray = Object.values(avaliacao.notas) as number[];
  const mediaNotas = notasArray.reduce((a, b) => a + b, 0) / notasArray.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Detalhes da Avaliação
          </h1>
          <p className="text-muted-foreground mt-1">
            Resultado da avaliação de {avaliacao.aprendiz}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informações Gerais</CardTitle>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluída
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Aprendiz</p>
              <p className="font-medium">{avaliacao.aprendiz}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gestor</p>
              <p className="font-medium">{avaliacao.gestor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Conclusão</p>
              <p className="font-medium">{avaliacao.dataConclusao}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas por Critério</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(avaliacao.notas).map(([criterio, nota]: any) => (
            <div
              key={criterio}
              className="flex items-center justify-between pb-3 border-b last:border-0"
            >
              <span className="font-medium">{criterio}</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`h-8 w-8 rounded flex items-center justify-center text-sm font-medium ${
                        n <= nota
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <span className="text-lg font-bold ml-2">{nota}</span>
              </div>
            </div>
          ))}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Média Final</span>
              <span className="text-2xl font-bold text-primary">
                {mediaNotas.toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {avaliacao.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações do Gestor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{avaliacao.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
