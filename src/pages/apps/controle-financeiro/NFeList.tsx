import { useState, useEffect } from 'react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CFOPClassification from "@/components/controle-financeiro/CFOPClassification";
import { useAuth } from '@/components/auth/controle-financeiro/AuthProvider';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NFeTax {
  id: string;
  tax_type: string;
  base_calculation: number;
  tax_rate: number;
  tax_value: number;
}

interface NFeItem {
  id: string;
  product_code: string;
  product_description: string;
  ncm: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  nfe_taxes: NFeTax[];
}

interface NFeDuplicata {
  id: string;
  numero_parcela: string;
  data_vencimento: string;
  valor_parcela: number;
}

interface NFeDocument {
  id: string;
  nfe_number: string;
  serie: string;
  emission_date: string;
  operation_nature: string;
  cfop: string;
  total_products_value: number;
  total_icms_value: number;
  total_pis_value: number;
  total_cofins_value: number;
  total_ipi_value: number;
  total_iss_value: number;
  total_nfe_value: number;
  fatura_numero?: string;
  fatura_valor_original: number;
  fatura_valor_desconto: number;
  fatura_valor_liquido: number;
  created_at: string;
  nfe_emitters: Array<{
    cnpj: string;
    razao_social: string;
    municipio: string;
    uf: string;
  }>;
  nfe_recipients: Array<{
    cnpj: string;
    razao_social: string;
    municipio: string;
    uf: string;
  }>;
  nfe_items: NFeItem[];
  nfe_duplicatas: NFeDuplicata[];
}

export default function NFeList() {
  const { companyId } = useAuth();
  const [nfeDocuments, setNfeDocuments] = useState<NFeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadNFeDocuments = async () => {
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

      if (error) throw error;
      setNfeDocuments(data || []);
    } catch (error) {
      console.error('Error loading NFe documents:', error);
      toast({
        title: "Erro ao carregar NFes",
        description: "Não foi possível carregar a lista de Notas Fiscais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {/* <div>
          <h1 className="text-3xl font-bold tracking-tight">Notas Fiscais Carregadas</h1>
          <p className="text-muted-foreground">
            Visualize todas as NFes importadas e classifique CFOPs para análise de margem
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {nfeDocuments.length} NFe{nfeDocuments.length !== 1 ? 's' : ''}
        </Badge> */}
      </div>

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
              Lista de NFes
            </CardTitle>
            <Button onClick={loadNFeDocuments} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Buscar NFe's
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
                Clique em 'Buscar NFe's' para carregar as notas fiscais ou acesse o módulo de Upload NFe para carregar novos arquivos XML.
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
                    <>
                      <TableRow 
                        key={nfe.id} 
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
                        <TableRow>
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
                                        <p className="font-medium">{formatCurrency(nfe.fatura_valor_original || 0)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Desconto:</span>
                                        <p className="font-medium">{formatCurrency(nfe.fatura_valor_desconto || 0)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Valor Líquido:</span>
                                        <p className="font-medium">{formatCurrency(nfe.fatura_valor_liquido || 0)}</p>
                                      </div>
                                    </div>

                                    {nfe.nfe_duplicatas && nfe.nfe_duplicatas.length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium">Duplicatas:</p>
                                        <div className="grid gap-2">
                                          {nfe.nfe_duplicatas.map((dup, idx) => (
                                            <div 
                                              key={idx} 
                                              className="flex justify-between items-center p-3 bg-background rounded-lg border"
                                            >
                                              <div className="flex items-center gap-4">
                                                <span className="font-medium">{dup.numero_parcela}</span>
                                                <span className="text-muted-foreground text-sm">
                                                  Vencimento: {format(new Date(dup.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                                                </span>
                                              </div>
                                              <span className="font-medium">{formatCurrency(dup.valor_parcela)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <Separator />
                                </>
                              )}

                              {/* Itens da NFe */}
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Itens da NFe
                                </h4>
                                <div className="space-y-4">
                                  {nfe.nfe_items?.map((item, idx) => (
                                    <div key={idx} className="border rounded-lg p-4 bg-background">
                                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                                        <div>
                                          <span className="text-muted-foreground text-sm">Código:</span>
                                          <p className="font-medium">{item.product_code}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground text-sm">NCM:</span>
                                          <p className="font-medium">{item.ncm}</p>
                                        </div>
                                      </div>
                                      <div className="mb-3">
                                        <span className="text-muted-foreground text-sm">Descrição:</span>
                                        <p className="font-medium">{item.product_description}</p>
                                      </div>
                                      <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div>
                                          <span className="text-muted-foreground text-sm">Quantidade:</span>
                                          <p className="font-medium">{item.quantity}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground text-sm">Valor Unitário:</span>
                                          <p className="font-medium">{formatCurrency(item.unit_value)}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground text-sm">Valor Total:</span>
                                          <p className="font-medium">{formatCurrency(item.total_value)}</p>
                                        </div>
                                      </div>

                                      {item.nfe_taxes && item.nfe_taxes.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                          <p className="text-sm font-medium mb-2">Impostos:</p>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {item.nfe_taxes.map((tax, taxIdx) => (
                                              <div key={taxIdx} className="text-sm">
                                                <Badge variant="outline" className="mb-1">
                                                  {tax.tax_type}
                                                </Badge>
                                                <div className="space-y-1 text-xs">
                                                  <div>
                                                    <span className="text-muted-foreground">Alíquota:</span>
                                                    <span className="ml-1 font-medium">{tax.tax_rate}%</span>
                                                  </div>
                                                  <div>
                                                    <span className="text-muted-foreground">Valor:</span>
                                                    <span className="ml-1 font-medium">{formatCurrency(tax.tax_value)}</span>
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
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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