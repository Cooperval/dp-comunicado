// src/pages/sgdnc/VisualizarDocumento.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentos } from '@/hooks/sgdnc/useDocumentos';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, Edit, Download, Share2, ChevronRight, ChevronLeft,
  FileText, History, Activity, Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ParagrafoViewer } from '@/components/sgdnc/editor/ParagrafoViewer';

export default function VisualizarDocumento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documentos, loading: loadingDocs } = useDocumentos();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Encontra o documento pelo id_documento
  const documento = documentos.find(doc => doc.id_documento === Number(id));

  useEffect(() => {
    if (!loadingDocs && !documento) {
      toast.error('Documento não encontrado');
      navigate('/apps/sgdnc/documentos');
    }
  }, [documento, loadingDocs, navigate]);

  const handleDownload = () => {
    if (!documento?.conteudo) return;

    const texto = documento.conteudo.paragraphs
      .map(p => {
        if (p.type === 'texto') return p.content;
        if (p.type === 'tabela') {
          return p.content.colunas.join(' | ') + '\n' +
            p.content.linhas.map((row: string[]) => row.join(' | ')).join('\n');
        }
        return '';
      })
      .join('\n\n');

    const blob = new Blob([`
TÍTULO: ${documento.titulo}
TIPO: ${documento.tipo}
NÍVEL: ${documento.nivel_conformidade}
VALIDADE: ${documento.data_validade ? new Date(documento.data_validade).toLocaleDateString() : 'Sem'}
CONTEÚDO:
${texto}
    `.trim()], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documento.titulo.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado!');
  };

  if (loadingDocs) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!documento) {
    return null; // useEffect redireciona
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">{documento.titulo}</h1>
            </div>
            <div className="flex items-center gap-2 mt-2 ml-10">
              <Badge variant="secondary">v{documento.versao}</Badge>
              <Badge variant="outline">{documento.tipo.replace('-', ' ')}</Badge>
            </div>
            {documento.descricao && (
              <p className="text-sm text-muted-foreground mt-1 ml-10">{documento.descricao}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/apps/sgdnc/documentos/${id}/editar`)}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Baixar
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar
            </Button>
            <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Conteúdo do Documento
                </CardTitle>
                <CardDescription>
                  Criado em: {format(new Date(documento.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documento.conteudo?.paragraphs && documento.conteudo.paragraphs.length > 0 ? (
                  <div className="space-y-6">
                    {documento.conteudo.paragraphs.map((p, i) => (
                      <ParagrafoViewer key={p.id || i} paragrafo={p} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem conteúdo estruturado.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Metadados</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm">Nível</p>
                  <Badge className="mt-1" variant={
                    documento.nivel_conformidade === 'critico' ? 'destructive' :
                    documento.nivel_conformidade === 'alto' ? 'default' : 'secondary'
                  }>
                    {documento.nivel_conformidade}
                  </Badge>
                </div>
                {documento.data_validade && (
                  <div>
                    <p className="font-medium text-sm">Validade</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(documento.data_validade), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">Responsável</p>
                  <p className="text-sm text-muted-foreground">ID: {documento.responsavel_aprovacao}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Pasta</p>
                  <p className="text-sm text-muted-foreground">ID: {documento.pasta_id || 'Raiz'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {sidebarOpen && (
          <div className="w-96 border-l bg-background">
            <Tabs defaultValue="historico">
              <div className="border-b p-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="historico"><History className="h-3 w-3 mr-1" /> Histórico</TabsTrigger>
                  <TabsTrigger value="auditoria"><Activity className="h-3 w-3 mr-1" /> Auditoria</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="historico" className="p-4">
                <p className="text-sm text-muted-foreground">Histórico em desenvolvimento.</p>
              </TabsContent>
              <TabsContent value="auditoria" className="p-4">
                <p className="text-sm text-muted-foreground">Logs em desenvolvimento.</p>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}