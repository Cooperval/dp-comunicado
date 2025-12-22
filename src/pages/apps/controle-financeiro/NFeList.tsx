import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Calendar,
  Receipt,
  Package,
  DollarSign,
  Loader2,
  Eye,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CFOPClassification from "@/pages/apps/controle-financeiro/components/CFOPClassification";
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, formatCNPJ } from '@/pages/apps/controle-financeiro/utils/formatters';
import type { NFeDocument } from '@/pages/apps/controle-financeiro/types/nfe';

export default function NFeList() {
  const { companyId } = useAuth();
  const [nfeDocuments, setNfeDocuments] = useState<NFeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadNFeDocuments = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!companyId) {
        setNfeDocuments([]);
        return;
      }

      const { data, error } = await supabase
        .from('nfe_documents')
        .select(`
          *,
          nfe_emitters (*),
          nfe_recipients (*),
          nfe_items (
            *,
            nfe_taxes (*)
          ),
          nfe_duplicatas (*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro ao carregar NFes",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setNfeDocuments(data || []);
      toast({
        title: "NFes carregadas",
        description: `${data?.length || 0} notas fiscais encontradas`,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar NFes",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  const toggleRowExpansion = useCallback((id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  }, [expandedRows]);

  // Carrega NFes automaticamente ao montar o componente
  useEffect(() => {
    if (companyId) {
      loadNFeDocuments();
    }
  }, [companyId, loadNFeDocuments]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Lista de NFes
          </TabsTrigger>
          <TabsTrigger value="cfop" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Classificação CFOPs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="cfop" className="mt-6">
          <CFOPClassification onUpdate={loadNFeDocuments} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Lista de NFes ({nfeDocuments.length})
                </CardTitle>
                <Button onClick={loadNFeDocuments} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Atualizar Lista
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Carregando NFes...</p>
                </div>
              ) : nfeDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma NFe encontrada</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Acesse o módulo de Upload NFe para carregar novos arquivos XML.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Número/Série</TableHead>
                        <TableHead>Emitente</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Data Emissão</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Data Import.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nfeDocuments.map((nfe) => (
                        <React.Fragment key={nfe.id}>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleRowExpansion(nfe.id)}
                          >
                            <TableCell>
                              {expandedRows.has(nfe.id) ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </TableCell>
                            <TableCell className="font-medium">
                              {nfe.nfe_number}/{nfe.serie}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{nfe.nfe_emitters?.[0]?.razao_social}</div>
                                <div className="text-xs text-muted-foreground">
                                  {nfe.nfe_emitters?.[0]?.cnpj ? formatCNPJ(nfe.nfe_emitters[0].cnpj) : '-'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{nfe.nfe_recipients?.[0]?.razao_social}</div>
                                <div className="text-xs text-muted-foreground">
                                  {nfe.nfe_recipients?.[0]?.cnpj ? formatCNPJ(nfe.nfe_recipients[0].cnpj) : '-'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(nfe.emission_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(nfe.total_nfe_value)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {nfe.nfe_items?.length || 0} {(nfe.nfe_items?.length || 0) === 1 ? 'item' : 'itens'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(nfe.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </TableCell>
                          </TableRow>

                          {expandedRows.has(nfe.id) && (
                            <TableRow key={`${nfe.id}-detail`}>
                              <TableCell colSpan={8} className="bg-muted/30 p-6">
                                <div className="space-y-6">
                                  {/* Informações da NFe */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Informações da NFe
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Número:</span>
                                        <p className="font-medium">{nfe.nfe_number}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Série:</span>
                                        <p className="font-medium">{nfe.serie}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">CFOP:</span>
                                        <p className="font-medium">{nfe.cfop || '-'}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Natureza:</span>
                                        <p className="font-medium">{nfe.operation_nature}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Emitente e Destinatário */}
                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Emitente
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Razão Social:</span>
                                          <p className="font-medium">{nfe.nfe_emitters?.[0]?.razao_social}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">CNPJ:</span>
                                          <p className="font-medium">
                                            {nfe.nfe_emitters?.[0]?.cnpj ? formatCNPJ(nfe.nfe_emitters[0].cnpj) : '-'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Município/UF:</span>
                                          <p className="font-medium">
                                            {nfe.nfe_emitters?.[0]?.municipio}/{nfe.nfe_emitters?.[0]?.uf}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Destinatário
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Razão Social:</span>
                                          <p className="font-medium">{nfe.nfe_recipients?.[0]?.razao_social}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">CNPJ:</span>
                                          <p className="font-medium">
                                            {nfe.nfe_recipients?.[0]?.cnpj ? formatCNPJ(nfe.nfe_recipients[0].cnpj) : '-'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Município/UF:</span>
                                          <p className="font-medium">
                                            {nfe.nfe_recipients?.[0]?.municipio}/{nfe.nfe_recipients?.[0]?.uf}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Informações de Cobrança */}
                                  {(nfe.fatura_numero || nfe.nfe_duplicatas?.length > 0) && (
                                    <>
                                      <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <DollarSign className="h-4 w-4" />
                                          Informações de Cobrança
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                          {nfe.fatura_numero && (
                                            <div>
                                              <span className="text-muted-foreground">Fatura:</span>
                                              <p className="font-medium">{nfe.fatura_numero}</p>
                                            </div>
                                          )}
                                          <div>
                                            <span className="text-muted-foreground">Valor Original:</span>
                                            <p className="font-medium">{formatCurrency(nfe.fatura_valor_original ?? 0)}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Desconto:</span>
                                            <p className="font-medium">{formatCurrency(nfe.fatura_valor_desconto ?? 0)}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Valor Líquido:</span>
                                            <p className="font-medium">{formatCurrency(nfe.fatura_valor_liquido ?? 0)}</p>
                                          </div>
                                        </div>

                                        {nfe.nfe_duplicatas && nfe.nfe_duplicatas.length > 0 && (
                                          <div className="space-y-2">
                                            <p className="text-sm font-medium">Duplicatas:</p>
                                            <div className="grid gap-2">
                                              {nfe.nfe_duplicatas.map((dup) => (
                                                <div 
                                                  key={dup.id}
                                                  className="flex justify-between items-center p-3 bg-background rounded-lg border"
                                                >
                                                  <div className="flex items-center gap-4">
                                                    <div>
                                                      <p className="font-medium text-sm">{dup.numero_parcela}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                        Venc: {format(new Date(dup.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <Badge variant="outline">
                                                    {formatCurrency(dup.valor_parcela)}
                                                  </Badge>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <Separator />
                                    </>
                                  )}

                                  {/* Produtos */}
                                  {nfe.nfe_items && nfe.nfe_items.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Produtos ({nfe.nfe_items.length})
                                      </h4>
                                      <div className="space-y-3">
                                        {nfe.nfe_items.map((item) => (
                                          <div 
                                            key={item.id}
                                            className="border rounded-lg p-4 bg-background"
                                          >
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                              <div>
                                                <span className="text-xs text-muted-foreground">Código</span>
                                                <p className="font-medium text-sm">{item.product_code}</p>
                                              </div>
                                              <div className="col-span-2">
                                                <span className="text-xs text-muted-foreground">Descrição</span>
                                                <p className="font-medium text-sm">{item.product_description}</p>
                                              </div>
                                              <div>
                                                <span className="text-xs text-muted-foreground">NCM</span>
                                                <p className="font-medium text-sm">{item.ncm}</p>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                              <div>
                                                <span className="text-xs text-muted-foreground">Quantidade</span>
                                                <p className="font-medium">{item.quantity}</p>
                                              </div>
                                              <div>
                                                <span className="text-xs text-muted-foreground">Valor Unit.</span>
                                                <p className="font-medium">{formatCurrency(item.unit_value)}</p>
                                              </div>
                                              <div>
                                                <span className="text-xs text-muted-foreground">Total</span>
                                                <p className="font-medium text-lg">{formatCurrency(item.total_value)}</p>
                                              </div>
                                            </div>

                                            {item.nfe_taxes && item.nfe_taxes.length > 0 && (
                                              <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs font-medium mb-2 text-muted-foreground">Impostos</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                  {item.nfe_taxes.map((tax) => (
                                                    <div key={tax.id} className="bg-muted/30 rounded p-2">
                                                      <Badge variant="outline" className="mb-1 text-xs">
                                                        {tax.tax_type}
                                                      </Badge>
                                                      <div className="text-xs space-y-0.5">
                                                        <div className="flex justify-between">
                                                          <span className="text-muted-foreground">Base:</span>
                                                          <span className="font-medium">{formatCurrency(tax.base_calculation)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="text-muted-foreground">Alíq:</span>
                                                          <span className="font-medium">{tax.tax_rate}%</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="text-muted-foreground">Valor:</span>
                                                          <span className="font-medium">{formatCurrency(tax.tax_value)}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Resumo de Valores */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <Receipt className="h-4 w-4" />
                                      Resumo de Valores
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Produtos:</span>
                                        <p className="font-medium">{formatCurrency(nfe.total_products_value)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">ICMS:</span>
                                        <p className="font-medium">{formatCurrency(nfe.total_icms_value)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">PIS:</span>
                                        <p className="font-medium">{formatCurrency(nfe.total_pis_value)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">COFINS:</span>
                                        <p className="font-medium">{formatCurrency(nfe.total_cofins_value)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">IPI:</span>
                                        <p className="font-medium">{formatCurrency(nfe.total_ipi_value)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">ISS:</span>
                                        <p className="font-medium">{formatCurrency(nfe.total_iss_value)}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Total NFe:</span>
                                        <p className="font-bold text-lg">{formatCurrency(nfe.total_nfe_value)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
