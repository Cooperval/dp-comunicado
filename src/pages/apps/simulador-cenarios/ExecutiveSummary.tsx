import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSimulator } from '@/contexts/SimulatorContext';
import { TrendingUp, TrendingDown, DollarSign, Leaf, Wheat, Download } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { calcularResumoFinanceiro } from '@/utils/simulatorCalculations';

const ExecutiveSummary = () => {
  const { data } = useSimulator();

  const {
    totalProduction,
    revenues,
    costs,
    totalRevenue,
    totalImpostos,
    totalDerivativosCambio,
    grossProfit,
    totalCosts,
    prodEAC,
    prodEHC,
  } = calcularResumoFinanceiro(data);



  const handleExport = async () => {
    const element = document.getElementById('executive-summary-content');
    if (!element) {
      toast.error('Erro ao gerar PDF');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 20;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const finalHeight = imgHeight > availableHeight ? availableHeight : imgHeight;

      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, finalHeight);
      pdf.save('Resumo-Executivo.pdf');
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number, unit: string = '') => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value) + (unit ? ` ${unit}` : '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Resumo Executivo</h1>
          <p className="text-muted-foreground mt-2">Visão geral dos indicadores operacionais e financeiros</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          {/* <Badge variant="outline" className="text-lg px-4 py-2">
            <Factory className="w-4 h-4 mr-2" />
            Simulador Agroindustrial
          </Badge> */}
        </div>
      </div>

      <div id="executive-summary-content">

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue + totalDerivativosCambio - totalImpostos)}</div>
              <p className="text-xs text-muted-foreground">Receita Bruta - Impostos + Derivativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custos</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalCosts)}</div>
              <p className="text-xs text-muted-foreground">CPV + Despesas com vendas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resultado Operacional</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(grossProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margem: {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Etanol Total</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatNumber(totalProduction.totalEthanol, 'm³')}</div>
              <p className="text-xs text-muted-foreground">Hidratado + Anidro</p>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Produção */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Produção - Cana-de-Açúcar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cana Moída</p>
                  <p className="text-xl font-semibold">{formatNumber(totalProduction.sugarCane, 'ton')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Açúcar VHP</p>
                  <p className="text-xl font-semibold">{formatNumber(totalProduction.sugar, 'ton')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Etanol Hidratado</p>
                  <p className="text-xl font-semibold">{formatNumber(prodEHC, 'm³')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Etanol Anidro</p>
                  <p className="text-xl font-semibold">{formatNumber(prodEAC, 'm³')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wheat className="w-5 h-5" />
                Produção - Milho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Milho Moído</p>
                  <p className="text-xl font-semibold">{formatNumber(totalProduction.corn, 'ton')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Etanol Total</p>
                  <p className="text-xl font-semibold">{formatNumber(totalProduction.ethanolCorn, 'm³')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DDG</p>
                  <p className="text-xl font-semibold">{formatNumber(totalProduction.ddg, 'ton')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WDG</p>
                  <p className="text-xl font-semibold">{formatNumber(totalProduction.wdg, 'ton')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Receitas por Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Açúcar VHP:</span>
                  <span className="font-mono">{formatCurrency(revenues.sugar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Etanol Hidratado:</span>
                  <span className="font-mono">{formatCurrency(revenues.hydratedEthanol)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Etanol Anidro:</span>
                  <span className="font-mono">{formatCurrency(revenues.anhydrousEthanol)}</span>
                </div>
                <div className="flex justify-between">
                  <span>DDG:</span>
                  <span className="font-mono">{formatCurrency(revenues.ddg)}</span>
                </div>
                <div className="flex justify-between">
                  <span>WDG:</span>
                  <span className="font-mono">{formatCurrency(revenues.wdg)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CO₂:</span>
                  <span className="font-mono">{formatCurrency(revenues.co2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CBIO:</span>
                  <span className="font-mono">{formatCurrency(revenues.cbio)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outros Custos:</span>
                  <span className="font-mono">{formatCurrency(revenues.OtherCosts)}</span>
                </div>
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Derivativos e Câmbio:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Derivativos e Câmbio:</span>
                      <span className="font-mono">{formatCurrency(totalDerivativosCambio)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(totalRevenue + totalDerivativosCambio)}</span>
                </div>
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Impostos e Abatimentos:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Impostos e Abatimentos:</span>
                      <span className="font-mono">{formatCurrency(totalImpostos)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total Líquido:</span>
                  <span className="text-primary">{formatCurrency(totalRevenue + totalDerivativosCambio - totalImpostos)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Custos por Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Matéria Prima Cana:</span>
                    <span className="font-mono">{formatCurrency(costs.caneRawMaterial)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CCT Cana:</span>
                    <span className="font-mono">{formatCurrency(costs.caneCct)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Industrial Cana:</span>
                    <span className="font-mono">{formatCurrency(costs.caneIndustry)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Despesas Cana:</span>
                    <span className="font-mono">{formatCurrency(costs.caneExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Matéria Prima Milho:</span>
                    <span className="font-mono">{formatCurrency(costs.cornRawMaterial)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Industrial Milho:</span>
                    <span className="font-mono">{formatCurrency(costs.cornIndustry)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biomassa Milho:</span>
                    <span className="font-mono">{formatCurrency(costs.cornBiomass)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outros Custos:</span>
                    <span className="font-mono">{formatCurrency(costs.OtherCosts)}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Despesas com Vendas:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Comercialização Etanol:</span>
                      <span className="font-mono">{formatCurrency(costs.salesExpenses.ethanol)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comercialização Açúcar:</span>
                      <span className="font-mono">{formatCurrency(costs.salesExpenses.sugar)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-destructive">{formatCurrency(totalCosts)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outros Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Outros Produtos e Subprodutos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">{formatNumber(totalProduction.co2, 'ton')}</p>
                <p className="text-sm text-muted-foreground">CO₂ Total</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">{formatNumber(totalProduction.cbio, 'un')}</p>
                <p className="text-sm text-muted-foreground">Créditos CBIO</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">{formatNumber(totalProduction.ddg + totalProduction.wdg, 'ton')}</p>
                <p className="text-sm text-muted-foreground">Coprodutos (DDG+WDG)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveSummary;