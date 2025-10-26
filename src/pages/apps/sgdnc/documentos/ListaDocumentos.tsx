import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  Trash2,
  Grid3x3,
  List,
  History,
} from 'lucide-react';
import { getDocumentos, getPastas, deleteDocumento, type Documento } from '@/services/sgdncMockData';
import { toast } from 'sonner';
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

export default function ListaDocumentos() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pastas, setPastas] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [pastaFiltro, setPastaFiltro] = useState('');
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid');
  const [docParaExcluir, setDocParaExcluir] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [busca, pastaFiltro]);

  const carregarDados = async () => {
    setLoading(true);
    const [docsData, pastasData] = await Promise.all([
      getDocumentos({ busca, pastaId: pastaFiltro || undefined }),
      getPastas(),
    ]);
    setDocumentos(docsData);
    setPastas(pastasData);
    setLoading(false);
  };

  const handleExcluir = async () => {
    if (!docParaExcluir) return;
    
    try {
      await deleteDocumento(docParaExcluir);
      toast.success('Documento excluído com sucesso');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao excluir documento');
    } finally {
      setDocParaExcluir(null);
    }
  };

  const getNivelColor = (nivel: string) => {
    const cores: Record<string, string> = {
      critico: 'hsl(0 84% 60%)',
      alto: 'hsl(25 95% 53%)',
      medio: 'hsl(45 93% 47%)',
      baixo: 'hsl(142 76% 36%)',
    };
    return cores[nivel] || 'hsl(215 16% 47%)';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e organize seus documentos
          </p>
        </div>
        <Button onClick={() => navigate('/apps/sgdnc/documentos/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou tags..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={pastaFiltro} onValueChange={setPastaFiltro}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todas as pastas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as pastas</SelectItem>
                {pastas.map((pasta) => (
                  <SelectItem key={pasta.id} value={pasta.id}>
                    {pasta.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={visualizacao === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setVisualizacao('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={visualizacao === 'lista' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setVisualizacao('lista')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Carregando documentos...</p>
        </div>
      ) : documentos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro documento
            </p>
            <Button onClick={() => navigate('/apps/sgdnc/documentos/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Documento
            </Button>
          </CardContent>
        </Card>
      ) : visualizacao === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentos.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText
                    className="h-8 w-8 p-1.5 rounded"
                    style={{ backgroundColor: getNivelColor(doc.nivelConformidade), color: 'white' }}
                  />
                  <Badge variant="secondary">v{doc.versaoAtual}</Badge>
                </div>
                <CardTitle className="text-lg mt-2">{doc.titulo}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {doc.descricao}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {doc.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {doc.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{doc.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id}/editar`)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDocParaExcluir(doc.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-medium">Título</th>
                    <th className="text-left p-4 font-medium">Versão</th>
                    <th className="text-left p-4 font-medium">Nível</th>
                    <th className="text-left p-4 font-medium">Atualizado</th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((doc) => (
                    <tr key={doc.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{doc.titulo}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {doc.descricao}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">v{doc.versaoAtual}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          style={{
                            backgroundColor: `${getNivelColor(doc.nivelConformidade)}20`,
                            color: getNivelColor(doc.nivelConformidade),
                            borderColor: getNivelColor(doc.nivelConformidade),
                          }}
                        >
                          {doc.nivelConformidade}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(doc.atualizadoEm).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id}/editar`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDocParaExcluir(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação */}
      <AlertDialog open={!!docParaExcluir} onOpenChange={() => setDocParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
