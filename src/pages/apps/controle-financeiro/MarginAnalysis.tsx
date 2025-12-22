import React, { useState } from "react";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/pages/apps/controle-financeiro/utils/formatters";
import {
  MARGIN_THRESHOLDS,
  DEFAULT_COST_RATIO,
  CFOP_CLASSIFICATIONS,
  MARGIN_STATUS_STYLES,
} from "@/pages/apps/controle-financeiro/constants/marginConstants";
import type { NFeItem, NFeItemRaw, NCMGroup, CFOPClassification, MarginStatus } from "@/pages/apps/controle-financeiro/types/margin";
import { CompanyBranchFilter } from "@/pages/apps/controle-financeiro/components/filters/CompanyBranchFilter";
import { useCompanyBranchFilter } from "@/pages/apps/controle-financeiro/hooks/useCompanyBranchFilter";

const MarginAnalysis = () => {
  const { companyId } = useAuth();
  const [nfeItems, setNfeItems] = useState<NFeItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Company and Branch filter
  const companyBranchFilter = useCompanyBranchFilter();

  const fetchNFeItems = async () => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar itens de NFe com filtro de empresa e filial
      let query = supabase
        .from("nfe_items")
        .select(
          `
          id,
          product_code,
          product_description,
          ncm,
          quantity,
          unit_value,
          total_value,
          nfe_documents!inner(
            company_id,
            branch_id,
            cfop
          )
        `,
        )
        .eq("nfe_documents.company_id", companyBranchFilter.selectedCompanyId || companyId);

      if (companyBranchFilter.selectedBranchId) {
        query = query.eq("nfe_documents.branch_id", companyBranchFilter.selectedBranchId);
      }

      const { data, error } = await query.order("unit_value", { ascending: false });

      if (error) throw error;

      // Buscar classificações CFOP da empresa
      const { data: classificationsData, error: classError } = await supabase
        .from("cfop_classifications")
        .select("cfop, classification")
        .eq("company_id", companyId);

      if (classError) throw classError;

      // Criar mapa de classificações
      const classificationMap = (classificationsData || []).reduce(
        (acc, item: CFOPClassification) => {
          acc[item.cfop] = item.classification;
          return acc;
        },
        {} as Record<string, string>,
      );

      // Agrupar itens por NCM para calcular preços de custo e venda
      const ncmGroups = (data || []).reduce(
        (acc, item: NFeItemRaw) => {
          const ncm = item.ncm;
          if (!acc[ncm]) {
            acc[ncm] = {
              items: [],
              costItems: [],
              saleItems: [],
            };
          }

          acc[ncm].items.push(item);

          // Verificar classificação CFOP
          const classification = classificationMap[item.nfe_documents.cfop];
          if (classification === CFOP_CLASSIFICATIONS.COST) {
            acc[ncm].costItems.push(item);
          } else if (classification === CFOP_CLASSIFICATIONS.SALE) {
            acc[ncm].saleItems.push(item);
          }

          return acc;
        },
        {} as Record<string, NCMGroup>,
      );

      // Calcular margens para cada NCM
      const itemsWithMargin: NFeItem[] = Object.values(ncmGroups).map((group: NCMGroup) => {
        const avgCostPrice =
          group.costItems.length > 0
            ? group.costItems.reduce((sum, item) => sum + item.unit_value, 0) / group.costItems.length
            : 0;

        const avgSalePrice =
          group.saleItems.length > 0
            ? group.saleItems.reduce((sum, item) => sum + item.unit_value, 0) / group.saleItems.length
            : 0;

        // Usar o primeiro item como representante deste NCM
        const representativeItem = group.items[0];

        // Definir preços de custo e venda baseado nas classificações CFOP
        let costPrice = avgCostPrice > 0 ? avgCostPrice : 0;
        let salePrice = avgSalePrice > 0 ? avgSalePrice : 0;

        // Se não houver classificação, usar estimativa original
        if (costPrice === 0 && salePrice === 0) {
          salePrice = representativeItem.unit_value;
          costPrice = representativeItem.unit_value * DEFAULT_COST_RATIO;
        }

        const margin = salePrice - costPrice;

        return {
          id: representativeItem.id,
          product_code: representativeItem.product_code,
          product_description: representativeItem.product_description,
          ncm: representativeItem.ncm,
          quantity: group.items.reduce((sum, item) => sum + item.quantity, 0),
          cost_price: costPrice,
          sale_price: salePrice,
          total_value: representativeItem.total_value,
          margin: margin,
        };
      });

      setNfeItems(itemsWithMargin);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens das notas fiscais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMarginPercentage = (margin: number, sellingPrice: number): number => {
    return sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
  };

  const getMarginStatus = (marginPercentage: number): MarginStatus => {
    if (marginPercentage >= MARGIN_THRESHOLDS.EXCELLENT) return "excellent";
    if (marginPercentage >= MARGIN_THRESHOLDS.GOOD) return "good";
    return "poor";
  };

  const getMarginIcon = (marginPercentage: number) => {
    return marginPercentage >= MARGIN_THRESHOLDS.ICON_THRESHOLD ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CompanyBranchFilter
            companies={companyBranchFilter.companies}
            branches={companyBranchFilter.branches}
            selectedCompanyId={companyBranchFilter.selectedCompanyId}
            selectedBranchId={companyBranchFilter.selectedBranchId}
            onCompanyChange={companyBranchFilter.handleCompanyChange}
            onBranchChange={companyBranchFilter.handleBranchChange}
            loading={companyBranchFilter.loading}
          />

          <Button onClick={fetchNFeItems} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Buscando...
              </>
            ) : (
              "Buscar Margens"
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {nfeItems.map((item) => {
          const marginPercentage = getMarginPercentage(item.margin, item.sale_price);
          const status = getMarginStatus(marginPercentage);

          return (
            <Card key={item.id} className="hover:shadow-elevated transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{item.product_description}</h3>
                      <Badge variant="secondary">NCM: {item.ncm}</Badge>
                      <Badge variant="outline">Código: {item.product_code}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Preço de Custo:</span>
                        <p className="font-medium">{formatCurrency(item.cost_price)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preço de Venda:</span>
                        <p className="font-medium">{formatCurrency(item.sale_price)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Margem Unitária:</span>
                        <p className="font-medium">{formatCurrency(item.margin)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantidade:</span>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getMarginIcon(marginPercentage)}
                    <Badge className={MARGIN_STATUS_STYLES[status].className}>{marginPercentage.toFixed(1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {nfeItems.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Clique em "Buscar Margens" para visualizar os dados</h3>
            <p className="text-muted-foreground text-center mb-4">
              A análise será baseada nas classificações CFOP das notas fiscais importadas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarginAnalysis;
