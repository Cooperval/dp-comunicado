import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  GitCompare,
  AlertCircle,
  User,
  Clock,
  FileText
} from 'lucide-react';
import { getDocumentoByVersao, type Documento } from '@/pages/apps/sgdnc/services/sgdncMockData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { gerarPDFVersao } from '@/pages/apps/sgdnc/utils/pdfGenerator';
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
import type { Paragrafo, ImagemConteudo, TabelaConteudo } from '@/pages/apps/sgdnc/types/paragrafo';

export default function VisualizarVersao() {
  const { id, versaoNumero } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurarDialogOpen, setRestaurarDialogOpen] = useState(false);
  const versaoAtual = versaoNumero ? parseInt(versaoNumero) : 0;

  useEffect(() => {
    carregarVersao();
  }, [id, versaoNumero]);

  const carregarVersao = async () => {
    if (!id || !versaoNumero) return;
    
    try {
      setLoading(true);
      const data = await getDocumentoByVersao(id, parseInt(versaoNumero));
      setDocumento(data);
    } catch (error) {
      toast.error('Erro ao carregar versão do documento');
      navigate('/apps/sgdnc/documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documento) return;
    
    try {
      await gerarPDFVersao(documento, versaoAtual);
      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleRestaurar = async () => {
    // Mock de restauração - seria implementado no backend
    toast.success(`Versão ${versaoAtual} restaurada. Nova versão ${documento!.versaoAtual + 1} criada.`);
    setRestaurarDialogOpen(false);
    setTimeout(() => {
      navigate(`/apps/sgdnc/documentos/${id}`);
    }, 1500);
  };

  const handleNavegar = (novaVersao: number) => {
    navigate(`/apps/sgdnc/documentos/${id}/versoes/${novaVersao}`);
  };

  const renderParagrafo = (paragrafo: Paragrafo) => {
    if (paragrafo.tipo === 'texto') {
      return (
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{paragrafo.conteudo as string}</p>
        </div>
      );
    }
    
    if (paragrafo.tipo === 'imagem') {
      const imagem = paragrafo.conteudo as ImagemConteudo;
      return (
        <div className="space-y-2">
          <img 
            src={imagem.url} 
            alt={imagem.legenda || 'Imagem do documento'} 
            className="max-w-full h-auto rounded border"
          />
          {imagem.legenda && (
            <p className="text-sm text-muted-foreground italic">{imagem.legenda}</p>
          )}
        </div>
      );
    }
    
    if (paragrafo.tipo === 'tabela') {
      const tabela = paragrafo.conteudo as TabelaConteudo;
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                {tabela.colunas.map((coluna, idx) => (
                  <th key={idx} className="border border-border p-2 text-left font-medium">
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabela.linhas.map((linha, idxLinha) => (
                <tr key={idxLinha} className="hover:bg-muted/50">
                  {linha.map((celula, idxCelula) => (
                    <td key={idxCelula} className="border border-border p-2">
                      {celula}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Carregando versão...</p>
        </div>
      </div>
    );
  }

  if (!documento) {
    return null;
  }

  const versao = documento.versoes.find(v => v.numero === versaoAtual);
  const paragrafos = versao?.snapshot?.paragrafos || documento.paragrafos || [];
  const isVersaoAtual = versaoAtual === documento.versaoAtual;
  const versaoAnterior = versaoAtual > 1 ? versaoAtual - 1 : null;
  const versaoProxima = versaoAtual < documento.versaoAtual ? versaoAtual + 1 : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/apps/sgdnc/documentos/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Documento
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{documento.titulo}</h1>
            <Badge 
              variant={isVersaoAtual ? 'default' : 'secondary'}
              className="text-sm"
            >
              {isVersaoAtual ? 'Versão Atual' : 'Versão Antiga'} - v{versaoAtual}
            </Badge>
          </div>
          
          {versao && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{versao.criadoPor}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(versao.criadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          
          {!isVersaoAtual && user?.role === 'admin' && (
            <Button 
              variant="outline"
              onClick={() => setRestaurarDialogOpen(true)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )}
          
          {!isVersaoAtual && (
            <Button
              variant="outline"
              onClick={() => navigate(`/apps/sgdnc/documentos/${id}/versoes/${versaoAtual}/comparar`)}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Comparar
            </Button>
          )}
          
          <Button
            variant="default"
            onClick={() => navigate(`/apps/sgdnc/documentos/${id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Atual
          </Button>
        </div>
      </div>

      {/* Navegação entre versões */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={!versaoAnterior}
              onClick={() => versaoAnterior && handleNavegar(versaoAnterior)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Versão {versaoAnterior || '-'}
            </Button>
            
            <div className="text-center">
              <p className="text-sm font-medium">Visualizando Versão</p>
              <p className="text-2xl font-bold text-primary">v{versaoAtual}</p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              disabled={!versaoProxima}
              onClick={() => versaoProxima && handleNavegar(versaoProxima)}
            >
              Versão {versaoProxima || '-'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerta para versão antiga */}
      {!isVersaoAtual && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta é uma versão antiga do documento. A versão atual é v{documento.versaoAtual}.
            O conteúdo mostrado abaixo é como o documento estava na versão {versaoAtual}.
          </AlertDescription>
        </Alert>
      )}

      {/* Comentário da versão */}
      {versao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comentário da Versão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{versao.comentario}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadados */}
      <Card>
        <CardHeader>
          <CardTitle>Metadados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="capitalize">{documento.tipo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nível de Conformidade</p>
              <p className="capitalize">{documento.nivelConformidade}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {documento.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            {documento.dataValidade && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Validade</p>
                <p>{format(new Date(documento.dataValidade), 'dd/MM/yyyy', { locale: ptBR })}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do Documento */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo do Documento (versão {versaoAtual})</CardTitle>
          <CardDescription>
            {paragrafos.length > 0 
              ? `${paragrafos.length} parágrafo(s) nesta versão` 
              : 'Nenhum parágrafo nesta versão'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paragrafos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Esta versão não possui conteúdo de parágrafos.</p>
            </div>
          ) : (
            paragrafos.map((paragrafo, index) => (
              <div key={paragrafo.id} className="border-l-4 border-primary/30 pl-4 py-2">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {paragrafo.tipo === 'texto' ? 'Texto' :
                     paragrafo.tipo === 'imagem' ? 'Imagem' : 'Tabela'}
                  </Badge>
                </div>
                {renderParagrafo(paragrafo)}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dialog de Restauração */}
      <AlertDialog open={restaurarDialogOpen} onOpenChange={setRestaurarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Versão {versaoAtual}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação criará uma nova versão ({documento.versaoAtual + 1}) do documento com o conteúdo da versão {versaoAtual}.
              O histórico de versões será preservado e a operação poderá ser visualizada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestaurar}>
              Restaurar Versão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
