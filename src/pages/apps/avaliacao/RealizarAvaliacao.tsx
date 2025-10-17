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

interface Criterio {
  id: string;
  titulo: string;
  descricao: string;
}

const criterios: Criterio[] = [
  {
    id: '1',
    titulo: 'Pontualidade',
    descricao: 'Comparece no horário estabelecido',
  },
  {
    id: '2',
    titulo: 'Assiduidade',
    descricao: 'Presença regular no trabalho',
  },
  {
    id: '3',
    titulo: 'Proatividade',
    descricao: 'Toma iniciativa e busca soluções',
  },
  {
    id: '4',
    titulo: 'Trabalho em Equipe',
    descricao: 'Colabora e se comunica bem com o time',
  },
  {
    id: '5',
    titulo: 'Aprendizado',
    descricao: 'Demonstra evolução e absorção de conhecimento',
  },
];

export default function RealizarAvaliacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avaliacao, setAvaliacao] = useState<any>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    const loadAvaliacao = async () => {
      const data = await mockAPI.getAvaliacaoById(id!);
      setAvaliacao(data);
    };
    loadAvaliacao();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const todasPreenchidas = criterios.every((c) => notas[c.id]);
    if (!todasPreenchidas) {
      toast({
        title: 'Erro',
        description: 'Avalie todos os critérios antes de enviar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await mockAPI.submitAvaliacao(id!, { notas, observacoes });

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
        <CardContent className="space-y-2">
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
            <CardTitle>Critérios de Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {criterios.map((criterio) => (
              <div key={criterio.id} className="space-y-3 pb-6 border-b last:border-0">
                <div>
                  <h3 className="font-semibold">{criterio.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {criterio.descricao}
                  </p>
                </div>
                <RadioGroup
                  value={notas[criterio.id]}
                  onValueChange={(value) =>
                    setNotas({ ...notas, [criterio.id]: value })
                  }
                  className="flex gap-4"
                >
                  {['1', '2', '3', '4', '5'].map((nota) => (
                    <div key={nota} className="flex items-center space-x-2">
                      <RadioGroupItem value={nota} id={`${criterio.id}-${nota}`} />
                      <Label htmlFor={`${criterio.id}-${nota}`}>{nota}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione comentários sobre o desempenho do aprendiz..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={6}
            />
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
