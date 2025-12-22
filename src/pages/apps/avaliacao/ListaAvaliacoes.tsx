import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Edit, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { mockAPI } from '@/services/mockData';

interface Avaliacao {
  id: string;
  aprendiz: string;
  gestor: string;
  prazo: string;
  status: 'pendente' | 'concluida' | 'atrasada';
  dataCriacao: string;
  dataConclusao?: string;
}

export default function ListaAvaliacoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRH = user?.department === 'RH';
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAvaliacoes = async () => {
      setLoading(true);
      const data = await mockAPI.getAvaliacoes();
      setAvaliacoes(data);
      setLoading(false);
    };
    loadAvaliacoes();
  }, [user?.id, isRH]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'concluida':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluída
          </Badge>
        );
      case 'atrasada':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Atrasada
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">Carregando...</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isRH ? 'Todas as Avaliações' : 'Minhas Avaliações'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRH
            ? 'Visualize e gerencie todas as avaliações cadastradas'
            : 'Avaliações atribuídas para você realizar'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          {avaliacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma avaliação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aprendiz</TableHead>
                    {isRH && <TableHead>Gestor</TableHead>}
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Criação</TableHead>
                    {isRH && <TableHead>Conclusão</TableHead>}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avaliacoes.map((avaliacao) => (
                    <TableRow key={avaliacao.id}>
                      <TableCell className="font-medium">
                        {avaliacao.aprendiz}
                      </TableCell>
                      {isRH && <TableCell>{avaliacao.gestor}</TableCell>}
                      <TableCell>{avaliacao.prazo}</TableCell>
                      <TableCell>{getStatusBadge(avaliacao.status)}</TableCell>
                      <TableCell>{avaliacao.dataCriacao}</TableCell>
                      {isRH && (
                        <TableCell>
                          {avaliacao.dataConclusao || '-'}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {avaliacao.status === 'pendente' && !isRH && (
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate(`/apps/avaliacao/realizar/${avaliacao.id}`)
                              }
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Avaliar
                            </Button>
                          )}
                          {(avaliacao.status === 'concluida' || isRH) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/apps/avaliacao/detalhes/${avaliacao.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
