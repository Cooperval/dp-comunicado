import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Download, Calendar, User } from 'lucide-react';
import { TextoParagrafo } from '@/components/sgdnc/editor/TextoParagrafo';
import { ImagemParagrafo } from '@/components/sgdnc/editor/ImagemParagrafo';
import { TabelaParagrafo } from '@/components/sgdnc/editor/TabelaParagrafo';
import { HistoricoAprovacao } from '@/components/sgdnc/HistoricoAprovacao';
import { PainelAprovacao } from '@/components/sgdnc/PainelAprovacao';
import { getDocumentoById, aprovarDocumento, rejeitarDocumento, solicitarRevisaoDocumento, mockAprovadores, type Documento } from '@/services/sgdncMockData';
import { toast } from 'sonner';
import type { ImagemConteudo, TabelaConteudo } from '@/types/paragrafo';

export default function DetalhesAprovacao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    carregarDocumento();
  }, [id]);

  const carregarDocumento = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const doc = await getDocumentoById(id);
      setDocumento(doc);
    } catch (error) {
      toast.error('Erro ao carregar documento');
      navigate('/apps/sgdnc/documentos/aprovacoes');
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async (comentario: string) => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await aprovarDocumento(id, user.name || 'Usuário', comentario);
      toast.success('Documento aprovado com sucesso!');
      carregarDocumento();
    } catch (error) {
      toast.error('Erro ao aprovar documento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeitar = async (comentario: string) => {
    if (!id || !user) return;
    if (!comentario.trim()) {
      toast.error('É necessário informar o motivo da rejeição');
      return;
    }
    setActionLoading(true);
    try {
      await rejeitarDocumento(id, user.name || 'Usuário', comentario);
      toast.success('Documento rejeitado');
      carregarDocumento();
    } catch (error) {
      toast.error('Erro ao rejeitar documento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSolicitarRevisao = async (comentario: string) => {
    if (!id || !user) return;
    if (!comentario.trim()) {
      toast.error('É necessário informar o que deve ser revisado');
      return;
    }
    setActionLoading(true);
    try {
      await solicitarRevisaoDocumento(id, user.name || 'Usuário', comentario);
      toast.success('Revisão solicitada');
      carregarDocumento();
    } catch (error) {
      toast.error('Erro ao solicitar revisão');
    } finally {
      setActionLoading(false);
    }
  };

  const formatarData = (dataString?: string) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        return 'Pendente Aprovação';
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

  if (loading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="container max-w-7xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Documento não encontrado</h3>
            <Button onClick={() => navigate('/apps/sgdnc/documentos/aprovacoes')}>
              Voltar para lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const responsavel = mockAprovadores.find((a) => a.id === documento.responsavelAprovacao);
  const podeAprovar =
    documento.statusAprovacao === 'pendente' &&
    responsavel?.nome === user?.name;

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/apps/sgdnc/documentos/aprovacoes')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{documento.titulo}</h1>
          <p className="text-muted-foreground mt-1">Detalhes e aprovação do documento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Status */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Status do Documento</CardTitle>
                  <CardDescription>Informações de aprovação</CardDescription>
                </div>
                <StatusBadge variant={getStatusVariant(documento.statusAprovacao)}>
                  {getStatusLabel(documento.statusAprovacao)}
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    Submetido por
                  </div>
                  <p className="font-medium">{documento.criadoPor}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Data de submissão
                  </div>
                  <p className="font-medium">{formatarData(documento.dataSubmissao)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    Responsável pela aprovação
                  </div>
                  <p className="font-medium">
                    {responsavel ? `${responsavel.nome} (${responsavel.cargo})` : '-'}
                  </p>
                </div>
                {documento.dataAprovacao && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Data de aprovação
                    </div>
                    <p className="font-medium">{formatarData(documento.dataAprovacao)}</p>
                  </div>
                )}
              </div>
              {documento.motivoRejeicao && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Motivo da rejeição:
                  </p>
                  <p className="text-sm">{documento.motivoRejeicao}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Documento */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
                <p>{documento.descricao || 'Sem descrição'}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h4>
                  <Badge variant="outline">{documento.tipo}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Nível de Conformidade
                  </h4>
                  <Badge variant="outline">{documento.nivelConformidade}</Badge>
                </div>
              </div>

              {documento.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {documento.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {documento.anexos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Arquivo anexado
                    </h4>
                    {documento.anexos.map((anexo) => (
                      <div
                        key={anexo.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{anexo.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {(anexo.tamanho / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Conteúdo do Documento */}
          {documento.paragrafos && documento.paragrafos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do Documento</CardTitle>
                <CardDescription>
                  {documento.paragrafos.length} parágrafo(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {documento.paragrafos.map((paragrafo) => (
                  <div key={paragrafo.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">
                        Parágrafo {paragrafo.ordem} - {paragrafo.tipo}
                      </Badge>
                    </div>
                    {paragrafo.tipo === 'texto' && (
                      <div className="prose prose-sm max-w-none">
                        {typeof paragrafo.conteudo === 'string' ? (
                          <p className="whitespace-pre-wrap">{paragrafo.conteudo}</p>
                        ) : null}
                      </div>
                    )}
                    {paragrafo.tipo === 'imagem' && (
                      <div>
                        {(paragrafo.conteudo as ImagemConteudo).url && (
                          <img
                            src={(paragrafo.conteudo as ImagemConteudo).url}
                            alt="Imagem do documento"
                            className="max-w-full h-auto rounded-lg"
                          />
                        )}
                        {(paragrafo.conteudo as ImagemConteudo).legenda && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {(paragrafo.conteudo as ImagemConteudo).legenda}
                          </p>
                        )}
                      </div>
                    )}
                    {paragrafo.tipo === 'tabela' && (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-border">
                          <thead>
                            <tr>
                              {(paragrafo.conteudo as TabelaConteudo).colunas.map((col, idx) => (
                                <th key={idx} className="border border-border p-2 bg-muted text-left">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(paragrafo.conteudo as TabelaConteudo).linhas.map((linha, idx) => (
                              <tr key={idx}>
                                {linha.map((celula, cellIdx) => (
                                  <td key={cellIdx} className="border border-border p-2">
                                    {celula}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <HistoricoAprovacao historico={documento.historico} />
        </div>

        {/* Coluna lateral - Painel de Aprovação */}
        <div className="space-y-6">
          {podeAprovar ? (
            <PainelAprovacao
              onAprovar={handleAprovar}
              onRejeitar={handleRejeitar}
              onSolicitarRevisao={handleSolicitarRevisao}
              loading={actionLoading}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ações de Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {documento.statusAprovacao === 'pendente'
                    ? 'Apenas o responsável pela aprovação pode realizar ações neste documento.'
                    : 'Este documento já foi processado e não requer mais ações de aprovação.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
