import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { mockAPI } from '@/services/mockData';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function GerenciarAvaliacoes() {
  const navigate = useNavigate();
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelos();
  }, []);

  const loadModelos = async () => {
    setLoading(true);
    const data = await mockAPI.getModelosAvaliacao();
    setModelos(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await mockAPI.deleteModeloAvaliacao(id);
      toast({
        title: 'Sucesso',
        description: 'Modelo excluído com sucesso',
      });
      loadModelos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir modelo',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await mockAPI.duplicateModeloAvaliacao(id);
      toast({
        title: 'Sucesso',
        description: 'Modelo duplicado com sucesso',
      });
      loadModelos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao duplicar modelo',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="animate-fade-in">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Modelos</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie modelos de avaliação com perguntas personalizadas
          </p>
        </div>
        <Button onClick={() => navigate('/apps/avaliacao/modelos/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      {modelos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum modelo criado ainda</p>
            <Button onClick={() => navigate('/apps/avaliacao/modelos/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Modelo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modelos.map((modelo) => (
            <Card key={modelo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{modelo.titulo}</CardTitle>
                    <Badge variant={modelo.ativo ? 'default' : 'secondary'}>
                      {modelo.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {modelo.descricao}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{modelo.perguntas.length} perguntas</span>
                  <span>•</span>
                  <span>
                    {modelo.perguntas.filter((p: any) => p.tipo === 'multipla_escolha').length} múltipla escolha
                  </span>
                  <span>•</span>
                  <span>
                    {modelo.perguntas.filter((p: any) => p.tipo === 'descritiva').length} descritivas
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/apps/avaliacao/modelos/visualizar/${modelo.id}`)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/apps/avaliacao/modelos/editar/${modelo.id}`)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(modelo.id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O modelo será excluído permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(modelo.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
