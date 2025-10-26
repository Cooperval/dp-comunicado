import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Download,
  Share2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Paperclip,
  History,
  Activity,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getDocumentoById, type Documento } from '@/services/sgdncMockData';
import { VersionHistory } from '@/components/sgdnc/VersionHistory';
import { AuditLog } from '@/components/sgdnc/AuditLog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock audit logs
const mockAuditLogs = [
  {
    id: '1',
    tipo: 'visualizacao' as const,
    usuario: 'João Silva',
    data: new Date().toISOString(),
    detalhes: 'Abriu o documento para leitura',
  },
  {
    id: '2',
    tipo: 'edicao' as const,
    usuario: 'Maria Santos',
    data: new Date(Date.now() - 86400000).toISOString(),
    detalhes: 'Atualizou informações do documento',
  },
  {
    id: '3',
    tipo: 'download' as const,
    usuario: 'Pedro Costa',
    data: new Date(Date.now() - 172800000).toISOString(),
    detalhes: 'Baixou versão 2.0',
  },
];

export default function VisualizarDocumento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    carregarDocumento();
  }, [id]);

  const carregarDocumento = async () => {
    try {
      setLoading(true);
      const doc = await getDocumentoById(id!);
      if (!doc) {
        toast.error('Documento não encontrado');
        navigate('/apps/sgdnc/documentos');
        return;
      }
      setDocumento(doc);
    } catch (error) {
      toast.error('Erro ao carregar documento');
      navigate('/apps/sgdnc/documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    toast.success('Download iniciado');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado para a área de transferência');
  };

  const handleRestore = (versao: number) => {
    toast.success(`Versão ${versao} restaurada com sucesso`);
    carregarDocumento();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!documento) {
    return null;
  }

  const isPDF = documento.anexos[0]?.tipo === 'application/pdf';
  const isImage = documento.anexos[0]?.tipo?.startsWith('image/');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/apps/sgdnc/documentos')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">{documento.titulo}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-10">
              <Badge variant="secondary">v{documento.versaoAtual}</Badge>
              {documento.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            {documento.descricao && (
              <p className="text-sm text-muted-foreground ml-10">{documento.descricao}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/apps/sgdnc/documentos/${id}/editar`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Viewer Area */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="container max-w-5xl py-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Visualização do Documento
                </CardTitle>
                <CardDescription>
                  Última atualização:{' '}
                  {format(new Date(documento.atualizadoEm), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPDF ? (
                  <div className="aspect-[8.5/11] bg-white rounded-lg border">
                    <iframe
                      src={documento.anexos[0].url}
                      className="w-full h-full rounded-lg"
                      title={documento.titulo}
                    />
                  </div>
                ) : isImage ? (
                  <div className="flex justify-center">
                    <img
                      src={documento.anexos[0].url}
                      alt={documento.titulo}
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">
                        Pré-visualização não disponível
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Formato: {documento.anexos[0]?.tipo || 'Desconhecido'}
                      </p>
                    </div>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Documento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Informações do Documento</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Tipo</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {documento.tipo.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Nível de Conformidade</p>
                  <Badge
                    variant={
                      documento.nivelConformidade === 'critico'
                        ? 'destructive'
                        : documento.nivelConformidade === 'alto'
                        ? 'default'
                        : 'secondary'
                    }
                    className="capitalize"
                  >
                    {documento.nivelConformidade}
                  </Badge>
                </div>
                {documento.dataValidade && (
                  <div>
                    <p className="text-sm font-medium">Data de Validade</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(documento.dataValidade), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Criado por</p>
                  <p className="text-sm text-muted-foreground">{documento.criadoPor}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-96 border-l bg-background overflow-auto">
            <Tabs defaultValue="historico" className="h-full">
              <div className="border-b p-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="historico" className="text-xs">
                    <History className="h-3 w-3 mr-1" />
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="anexos" className="text-xs">
                    <Paperclip className="h-3 w-3 mr-1" />
                    Anexos
                  </TabsTrigger>
                  <TabsTrigger value="auditoria" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Auditoria
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="historico" className="m-0">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">Histórico de Versões</h3>
                  <VersionHistory
                    versoes={documento.versoes}
                    versaoAtual={documento.versaoAtual}
                    onRestore={handleRestore}
                    isAdmin={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="anexos" className="m-0">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">Anexos do Documento</h3>
                  <div className="space-y-2">
                    {documento.anexos.map((anexo) => (
                      <Card key={anexo.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {anexo.nome}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(anexo.tamanho / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="auditoria" className="m-0">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">Log de Auditoria</h3>
                  <AuditLog logs={mockAuditLogs} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
