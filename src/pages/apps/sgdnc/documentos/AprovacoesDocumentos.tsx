import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Search, Eye, FileText } from 'lucide-react';
import { getDocumentos, mockAprovadores, type Documento } from '@/services/sgdncMockData';

export default function AprovacoesDocumentos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDocumentos();
  }, []);

  const carregarDocumentos = async () => {
    setLoading(true);
    const docs = await getDocumentos({});
    setDocumentos(docs);
    setLoading(false);
  };

  const filtrarDocumentos = (docs: Documento[]) => {
    return docs.filter((doc) => {
      const matchBusca =
        busca === '' ||
        doc.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        doc.descricao.toLowerCase().includes(busca.toLowerCase());

      const matchStatus = filtroStatus === 'todos' || doc.statusAprovacao === filtroStatus;
      const matchTipo = filtroTipo === 'todos' || doc.tipo === filtroTipo;

      return matchBusca && matchStatus && matchTipo;
    });
  };

  const documentosFiltrados = filtrarDocumentos(documentos);
  const documentosAguardandoMinhaAprovacao = documentosFiltrados.filter(
    (doc) =>
      doc.statusAprovacao === 'pendente' &&
      doc.responsavelAprovacao &&
      mockAprovadores.find((a) => a.id === doc.responsavelAprovacao)?.nome === user?.name
  );
  const documentosAprovadosPorMim = documentosFiltrados.filter((doc) =>
    doc.historico.some(
      (h) => h.acao === 'aprovado' && h.usuario === user?.name
    )
  );
  const documentosRejeitados = documentosFiltrados.filter(
    (doc) => doc.statusAprovacao === 'rejeitado'
  );

  const formatarData = (dataString?: string) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(data);
  };

  const getStatusVariant = (status: Documento['statusAprovacao']) => {
    switch (status) {
      case 'pendente':
        return 'pending';
      case 'aprovado':
        return 'approved';
      case 'rejeitado':
        return 'rejected';
      case 'rascunho':
        return 'draft';
      default:
        return 'draft';
    }
  };

  const getStatusLabel = (status: Documento['statusAprovacao']) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'aprovado':
        return 'Aprovado';
      case 'rejeitado':
        return 'Rejeitado';
      case 'rascunho':
        return 'Rascunho';
      default:
        return status;
    }
  };

  const getTipoLabel = (tipo: Documento['tipo']) => {
    switch (tipo) {
      case 'procedimento':
        return 'Procedimento';
      case 'registro-mapa':
        return 'Registro MAPA';
      case 'exportacao':
        return 'Exportação';
      case 'outro':
        return 'Outro';
      default:
        return tipo;
    }
  };

  const renderTabelaDocumentos = (docs: Documento[]) => {
    if (docs.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground">
              Não há documentos que correspondam aos critérios selecionados
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Título</th>
                  <th className="text-left p-4 font-medium">Tipo</th>
                  <th className="text-left p-4 font-medium">Criado por</th>
                  <th className="text-left p-4 font-medium">Responsável</th>
                  <th className="text-left p-4 font-medium">Data Submissão</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => {
                  const responsavel = mockAprovadores.find((a) => a.id === doc.responsavelAprovacao);
                  return (
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
                        <Badge variant="outline">{getTipoLabel(doc.tipo)}</Badge>
                      </td>
                      <td className="p-4 text-sm">{doc.criadoPor}</td>
                      <td className="p-4 text-sm">
                        {responsavel ? `${responsavel.nome} (${responsavel.cargo})` : '-'}
                      </td>
                      <td className="p-4 text-sm">{formatarData(doc.dataSubmissao)}</td>
                      <td className="p-4">
                        <StatusBadge variant={getStatusVariant(doc.statusAprovacao)}>
                          {getStatusLabel(doc.statusAprovacao)}
                        </StatusBadge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/apps/sgdnc/documentos/aprovacoes/${doc.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Visualizar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprovações de Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie e aprove documentos submetidos para revisão
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="procedimento">Procedimento</SelectItem>
                <SelectItem value="registro-mapa">Registro MAPA</SelectItem>
                <SelectItem value="exportacao">Exportação</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">
            Todos os Documentos
            <Badge variant="secondary" className="ml-2">
              {documentosFiltrados.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aguardando">
            Aguardando Minha Aprovação
            <Badge variant="secondary" className="ml-2">
              {documentosAguardandoMinhaAprovacao.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aprovados">
            Aprovados por Mim
            <Badge variant="secondary" className="ml-2">
              {documentosAprovadosPorMim.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejeitados">
            Rejeitados
            <Badge variant="secondary" className="ml-2">
              {documentosRejeitados.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Carregando documentos...</p>
            </div>
          ) : (
            renderTabelaDocumentos(documentosFiltrados)
          )}
        </TabsContent>

        <TabsContent value="aguardando">
          {renderTabelaDocumentos(documentosAguardandoMinhaAprovacao)}
        </TabsContent>

        <TabsContent value="aprovados">
          {renderTabelaDocumentos(documentosAprovadosPorMim)}
        </TabsContent>

        <TabsContent value="rejeitados">
          {renderTabelaDocumentos(documentosRejeitados)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
