import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentos, type Documento } from '@/hooks/sgdnc/useDocumentos';
import { usePastas, type Pasta } from '@/hooks/sgdnc/usePastas';

export default function ListaDocumentos() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const { pastas, loading: loadingPastas, fetchPastas } = usePastas();
  const { documentos, loading: loadingDocs, error: errorDocs, fetchDocumentos } = useDocumentos();

  console.log('pastas', pastas)
  console.log('documentos', documentos)

  const [busca, setBusca] = useState('');
  const [pastaAtual, setPastaAtual] = useState('');
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid');
  const [docParaExcluir, setDocParaExcluir] = useState<number | null>(null);
  const [docHistorico, setDocHistorico] = useState<Documento | null>(null);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [pastaEditando, setPastaEditando] = useState<Pasta | null>(null);
  const [pastaParaDeletar, setPastaParaDeletar] = useState<Pasta | null>(null);

  const [filtros, setFiltros] = useState({
    dataInicio: null as Date | null,
    dataFim: null as Date | null,
    autor: 'todos',
    status: 'todos',
  });
  const [ordenacao, setOrdenacao] = useState<{
    campo: 'titulo' | 'versao' | 'created_at' | null;
    ordem: 'asc' | 'desc';
  }>({ campo: null, ordem: 'asc' });
  const [paginacao, setPaginacao] = useState({ page: 1, itemsPerPage: 12 });

  // ...

  // FILTRAGEM
  const documentosFiltrados = documentos
    .filter(doc => {
      const matchesBusca = doc.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        doc.descricao?.toLowerCase().includes(busca.toLowerCase());
      const matchesPasta = !pastaAtual || doc.pasta_id === Number(pastaAtual);
      return matchesBusca && matchesPasta;
    });

  // ORDENAÇÃO
  let documentosOrdenados = [...documentosFiltrados];
  if (ordenacao.campo) {
    documentosOrdenados.sort((a, b) => {
      let aVal: any = a[ordenacao.campo];
      let bVal: any = b[ordenacao.campo];

      if (ordenacao.campo === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      }

      if (aVal < bVal) return ordenacao.ordem === 'asc' ? -1 : 1;
      if (aVal > bVal) return ordenacao.ordem === 'asc' ? 1 : -1;
      return 0;
    });
  }
  //===========================================================CRIAR PASTA
  // Substitua handleCreatePasta por handleSavePasta
  const handleSavePasta = async (data: {
    nome: string;
    pastaParentId?: string;
    cor?: string;
  }) => {
    if (!data.nome.trim()) {
      toast.error('O nome da pasta é obrigatório');
      return;
    }

    const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
    if (!urlApi) {
      toast.error('Erro de configuração: URL da API não definida');
      return;
    }

    const isEdit = !!pastaEditando;

    // URL CORRIGIDA para sua rota
    const url = isEdit
      ? `${urlApi}/sgdnc/atualizar-pasta/${pastaEditando!.id_pasta}`
      : `${urlApi}/sgdnc/nova-pasta`;

    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: data.nome,
          pasta_parent_id: data.pastaParentId || null,
          cor: data.cor || '#3B82F6',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Erro ao salvar pasta');
      }

      toast.success(isEdit ? 'Pasta atualizada com sucesso!' : 'Pasta criada com sucesso!');

      setFolderDialogOpen(false);
      setPastaEditando(null);

      // Recarrega pastas
      await fetchPastas();

      // Se estava na pasta editada, mantém a seleção
      if (isEdit && pastaAtual === String(pastaEditando!.id_pasta)) {
        setPastaAtual(String(pastaEditando!.id_pasta));
      }
    } catch (error: any) {
      console.error('Erro ao salvar pasta:', error);
      toast.error(error.message || 'Falha ao conectar com o servidor');
    }
  };



  const handleDeletePastaConfirm = async () => {
    if (!pastaParaDeletar) return;

    const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
    if (!urlApi) {
      toast.error('Erro de configuração: URL da API não definida');
      return;
    }

    try {
      const response = await fetch(`${urlApi}/sgdnc/deletar-pasta/${pastaParaDeletar.id_pasta}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar pasta');
      }

      toast.success(result.message || 'Pasta deletada com sucesso!');

      // Se estava visualizando a pasta deletada, volta para "Todas"
      if (pastaAtual === String(pastaParaDeletar.id_pasta)) {
        setPastaAtual('');
      }

      await fetchPastas(); // Recarrega a árvore de pastas
    } catch (error: any) {
      console.error('Erro ao deletar pasta:', error);
      toast.error(error.message || 'Erro ao deletar pasta');
    } finally {
      setPastaParaDeletar(null);
    }
  };
  const handleExcluir = async () => {
    if (!docParaExcluir) return;

    const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
    if (!urlApi) {
      toast.error('Erro de configuração: URL da API não definida');
      return;
    }

    try {
      const response = await fetch(`${urlApi}/sgdnc/documentos/${docParaExcluir}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao excluir');
      }

      toast.success('Documento excluído com sucesso');
      fetchDocumentos(); // recarrega
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir documento');
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
    const conteudoTexto = doc.conteudo?.paragraphs
      ?.map(p => {
        if (p.type === 'texto') return p.content;
        if (p.type === 'tabela') {
          return p.content.colunas?.join(' | ') + '\n' +
            p.content.linhas?.map((row: string[]) => row.join(' | ')).join('\n');
        }
        return '';
      })
      .join('\n\n') || '';

    const texto = `
TÍTULO: ${doc.titulo}
TIPO: ${doc.tipo}
NÍVEL: ${doc.nivel_conformidade}
RESPONSÁVEL: ${doc.responsavel_aprovacao}
VALIDADE: ${doc.data_validade ? new Date(doc.data_validade).toLocaleDateString() : 'Sem validade'}

CONTEÚDO:
${conteudoTexto}
  `.trim();

    const blob = new Blob([texto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.titulo.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado');
  };

  const toggleOrdenacao = (campo: 'titulo' | 'versao' | 'created_at') => {
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

  const getOrdenacaoIcon = (campo: 'titulo' | 'versao' | 'created_at') => {
    if (ordenacao.campo !== campo) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    }
    return ordenacao.ordem === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    );
  };



  // Paginação
  const totalPaginas = Math.ceil(documentosOrdenados.length / paginacao.itemsPerPage);
  const documentosPaginados = documentosOrdenados.slice(
    (paginacao.page - 1) * paginacao.itemsPerPage,
    paginacao.page * paginacao.itemsPerPage
  );

  const autoresUnicos = Array.from(new Set(documentos.map((d) => d.criado_por || 'Sistema')));



  const handleEditPasta = (pasta: Pasta) => {
    setPastaEditando(pasta);
    setFolderDialogOpen(true);
  };

  const handleDeletePasta = (pasta: Pasta) => {
    setPastaParaDeletar(pasta);
  };


  useEffect(() => {
    fetchPastas();
    fetchDocumentos();
  }, [fetchPastas, fetchDocumentos]);

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
              onEditPasta={handleEditPasta}
              onDeletePasta={handleDeletePasta}
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
                    onEditPasta={handleEditPasta}
                    onDeletePasta={handleDeletePasta}
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
        {loadingDocs ? (
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
              <Card key={doc.id_documento} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText
                      className="h-8 w-8 p-1.5 rounded"
                      style={{
                        backgroundColor: getNivelColor(doc.nivel_conformidade),
                        color: 'white',
                      }}
                    />
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary">v{doc.versao}</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{doc.documento} {doc.titulo}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {doc.descricao || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>

                {/* AÇÕES NO CARD */}
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Atualizado:</span>{' '}
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id_documento}`)}
                        title="Visualizar"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id_documento}/editar`)}
                        title="Editar"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setDocHistorico(doc)}
                        title="Histórico"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleDownload(doc)}
                        title="Baixar"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setDocParaExcluir(doc.id_documento)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
                        onClick={() => toggleOrdenacao('versao')}
                      >
                        Versão {getOrdenacaoIcon('versao')}
                      </th>
                      <th className="text-left p-4 font-medium">Nível</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleOrdenacao('created_at')}
                      >
                        Atualizado {getOrdenacaoIcon('created_at')}
                      </th>
                      <th className="text-right p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentosPaginados.map((doc) => (
                      <tr key={doc.id_documento} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{doc.documento} {doc.titulo}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {doc.descricao}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">v{doc.versao}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            style={{
                              backgroundColor: `${getNivelColor(doc.nivel_conformidade)}20`,
                              color: getNivelColor(doc.nivel_conformidade),
                              borderColor: getNivelColor(doc.nivel_conformidade),
                            }}
                          >
                            {doc.nivel_conformidade}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <StatusBadge
                            variant={
                              doc.status_aprovacao === 'pendente' ? 'pending' :
                                doc.status_aprovacao === 'aprovado' ? 'approved' :
                                  doc.status_aprovacao === 'rejeitado' ? 'rejected' :
                                    'draft'
                            }
                          >
                            {doc.status_aprovacao === 'pendente' ? 'Pendente' :
                              doc.status_aprovacao === 'aprovado' ? 'Aprovado' :
                                doc.status_aprovacao === 'rejeitado' ? 'Rejeitado' :
                                  'Rascunho'}
                          </StatusBadge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id_documento}`)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/apps/sgdnc/documentos/${doc.id_documento}/editar`)}
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
                              onClick={() => setDocParaExcluir(doc.id_documento)}
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
        onOpenChange={(open) => {
          setFolderDialogOpen(open);
          if (!open) setPastaEditando(null);
        }}
        onSave={handleSavePasta}
        pastas={pastas}
        pastaEditando={pastaEditando}
      />

      <DocumentHistoryDialog
        open={!!docHistorico}
        onOpenChange={() => setDocHistorico(null)}
        versoes={docHistorico?.versoes || []}
        titulo={docHistorico?.titulo || ''}
        documentoId={String(docHistorico?.id_documento || '')}
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


      <AlertDialog
        open={!!pastaParaDeletar}
        onOpenChange={(open) => !open && setPastaParaDeletar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a pasta "{pastaParaDeletar?.nome}"?
              Todas as subpastas e documentos serão movidos ou perdidos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePastaConfirm} className="bg-destructive">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

