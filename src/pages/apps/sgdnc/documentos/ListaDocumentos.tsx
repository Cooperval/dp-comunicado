import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  FileText,
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  Trash2,
  Grid3x3,
  List as ListIcon,
  History,
  Menu,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderPlus,
} from 'lucide-react';
import { getDocumentos, getPastas, deleteDocumento, createPasta, type Documento } from '@/services/sgdncMockData';
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
import { FolderTree } from '@/components/sgdnc/FolderTree';
import { FolderDialog } from '@/components/sgdnc/FolderDialog';
import { DocumentHistoryDialog } from '@/components/sgdnc/DocumentHistoryDialog';
import { FilterAdvancedPopover } from '@/components/sgdnc/FilterAdvancedPopover';

export default function ListaDocumentos() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pastas, setPastas] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [pastaAtual, setPastaAtual] = useState('');
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid');
  const [docParaExcluir, setDocParaExcluir] = useState<string | null>(null);
  const [docHistorico, setDocHistorico] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: null as Date | null,
    dataFim: null as Date | null,
    autor: '',
    status: '',
  });
  const [ordenacao, setOrdenacao] = useState<{
    campo: 'titulo' | 'versaoAtual' | 'atualizadoEm' | null;
    ordem: 'asc' | 'desc';
  }>({ campo: null, ordem: 'asc' });
  const [paginacao, setPaginacao] = useState({
    page: 1,
    itemsPerPage: 12,
  });

  useEffect(() => {
    carregarDados();
  }, [busca, pastaAtual, filtros]);

  const carregarDados = async () => {
    setLoading(true);
    const [docsData, pastasData] = await Promise.all([
      getDocumentos({ busca, pastaId: pastaAtual || undefined }),
      getPastas(),
    ]);
    
    let filteredDocs = docsData;
    
    // Aplicar filtros avançados
    if (filtros.dataInicio) {
      filteredDocs = filteredDocs.filter(
        (doc) => new Date(doc.criadoEm) >= filtros.dataInicio!
      );
    }
    if (filtros.dataFim) {
      filteredDocs = filteredDocs.filter(
        (doc) => new Date(doc.criadoEm) <= filtros.dataFim!
      );
    }
    if (filtros.autor) {
      filteredDocs = filteredDocs.filter((doc) => doc.criadoPor === filtros.autor);
    }
    if (filtros.status) {
      // Mock: considerar status com base na data de validade
      filteredDocs = filteredDocs.filter((doc) => {
        if (filtros.status === 'vencido') {
          return doc.dataValidade && new Date(doc.dataValidade) < new Date();
        }
        return true;
      });
    }
    
    setDocumentos(filteredDocs);
    setPastas(pastasData);
    setPaginacao((prev) => ({ ...prev, page: 1 })); // Reset page on filter
    setLoading(false);
  };

  const handleCreatePasta = async (data: {
    nome: string;
    pastaParentId?: string;
    cor?: string;
  }) => {
    try {
      await createPasta(data);
      toast.success('Pasta criada com sucesso');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao criar pasta');
    }
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

  const handleDownload = (doc: Documento) => {
    // Mock download
    const blob = new Blob([`Documento: ${doc.titulo}\nVersão: ${doc.versaoAtual}`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.titulo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download iniciado');
  };

  const toggleOrdenacao = (campo: 'titulo' | 'versaoAtual' | 'atualizadoEm') => {
    if (ordenacao.campo === campo) {
      if (ordenacao.ordem === 'asc') {
        setOrdenacao({ campo, ordem: 'desc' });
      } else if (ordenacao.ordem === 'desc') {
        setOrdenacao({ campo: null, ordem: 'asc' });
      }
    } else {
      setOrdenacao({ campo, ordem: 'asc' });
    }
  };

  const getOrdenacaoIcon = (campo: 'titulo' | 'versaoAtual' | 'atualizadoEm') => {
    if (ordenacao.campo !== campo) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    }
    return ordenacao.ordem === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    );
  };

  // Aplicar ordenação
  let documentosOrdenados = [...documentos];
  if (ordenacao.campo) {
    documentosOrdenados.sort((a, b) => {
      let aVal: any = a[ordenacao.campo!];
      let bVal: any = b[ordenacao.campo!];

      if (ordenacao.campo === 'atualizadoEm') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return ordenacao.ordem === 'asc' ? -1 : 1;
      if (aVal > bVal) return ordenacao.ordem === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Paginação
  const totalPaginas = Math.ceil(documentosOrdenados.length / paginacao.itemsPerPage);
  const documentosPaginados = documentosOrdenados.slice(
    (paginacao.page - 1) * paginacao.itemsPerPage,
    paginacao.page * paginacao.itemsPerPage
  );

  const autoresUnicos = Array.from(new Set(documentos.map((d) => d.criadoPor)));

  return (
    <div className="flex gap-6 animate-fade-in">
      {/* Sidebar de Pastas - Desktop */}
      <aside className="hidden lg:block w-64 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pastas</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFolderDialogOpen(true)}
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FolderTree
              pastas={pastas}
              pastaAtual={pastaAtual}
              onSelectPasta={setPastaAtual}
            />
          </CardContent>
        </Card>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
            <p className="text-muted-foreground mt-1">
              {documentosOrdenados.length} documento(s) encontrado(s)
            </p>
          </div>
          <div className="flex gap-2">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={sidebarAberta} onOpenChange={setSidebarAberta}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Pastas</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mb-4"
                    onClick={() => setFolderDialogOpen(true)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Nova Pasta
                  </Button>
                  <FolderTree
                    pastas={pastas}
                    pastaAtual={pastaAtual}
                    onSelectPasta={(id) => {
                      setPastaAtual(id);
                      setSidebarAberta(false);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
              <FilterAdvancedPopover
                filtros={filtros}
                onFiltrosChange={setFiltros}
                autores={autoresUnicos}
              />
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
                  <ListIcon className="h-4 w-4" />
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
        ) : documentosOrdenados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {busca || pastaAtual || filtros.autor || filtros.status
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro documento'}
              </p>
            </CardContent>
          </Card>
        ) : visualizacao === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documentosPaginados.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText
                      className="h-8 w-8 p-1.5 rounded"
                      style={{
                        backgroundColor: getNivelColor(doc.nivelConformidade),
                        color: 'white',
                      }}
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
                  <div className="flex flex-wrap gap-2">
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
                      onClick={() => setDocHistorico(doc)}
                    >
                      <History className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-3 w-3" />
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
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleOrdenacao('titulo')}
                      >
                        Título {getOrdenacaoIcon('titulo')}
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleOrdenacao('versaoAtual')}
                      >
                        Versão {getOrdenacaoIcon('versaoAtual')}
                      </th>
                      <th className="text-left p-4 font-medium">Nível</th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleOrdenacao('atualizadoEm')}
                      >
                        Atualizado {getOrdenacaoIcon('atualizadoEm')}
                      </th>
                      <th className="text-right p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentosPaginados.map((doc) => (
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
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id}`)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                navigate(`/apps/sgdnc/documentos/${doc.id}/editar`)
                              }
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDocHistorico(doc)}
                              title="Histórico"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(doc)}
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDocParaExcluir(doc.id)}
                              title="Excluir"
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

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setPaginacao((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                    }
                    className={
                      paginacao.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum: number;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (paginacao.page <= 3) {
                    pageNum = i + 1;
                  } else if (paginacao.page >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = paginacao.page - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPaginacao((p) => ({ ...p, page: pageNum }))}
                        isActive={paginacao.page === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPaginacao((p) => ({
                        ...p,
                        page: Math.min(totalPaginas, p.page + 1),
                      }))
                    }
                    className={
                      paginacao.page === totalPaginas
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Botão FAB */}
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl z-50"
          onClick={() => navigate('/apps/sgdnc/documentos/novo')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Dialogs */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSave={handleCreatePasta}
        pastas={pastas}
      />

      <DocumentHistoryDialog
        open={!!docHistorico}
        onOpenChange={() => setDocHistorico(null)}
        versoes={docHistorico?.versoes || []}
        titulo={docHistorico?.titulo || ''}
      />

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

