import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulator } from '@/pages/apps/simulador-cenarios/contexts/SimulatorContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { calcularDREPorProduto, ProductData, calculateConsolidatedData, getConsolidatedDREData, ConsolidatedDREData } from '@/pages/apps/simulador-cenarios/utils/simulatorCalculations';
import { ScenarioSelector } from '@/pages/apps/simulador-cenarios/components/ScenarioSelector';

const DREByProduct: React.FC = () => {
  const { data, saveScenario, savedScenarios } = useSimulator();
  const [selectedScenario, setSelectedScenario] = useState<string>('current');

  // Para visão consolidada, usar dados pré-calculados de scenario.data
  const consolidatedData = useMemo((): ConsolidatedDREData | null => {
    if (selectedScenario === 'consolidated') {
      return getConsolidatedDREData(savedScenarios);
    }
    return null;
  }, [selectedScenario, savedScenarios]);

  // Para cenário atual ou cenário específico, usa o cálculo normal
  const effectiveData = useMemo(() => {
    if (selectedScenario === 'current') return data;
    if (selectedScenario === 'consolidated') return data; // Será ignorado quando consolidatedData existe
    const scenario = savedScenarios.find(s => s.id === selectedScenario);
    return scenario?.originalData || data;
  }, [selectedScenario, data, savedScenarios]);

  // Verifica se está visualizando cenário salvo (não permite edição)
  const isViewingOnly = selectedScenario !== 'current';

  // Valores calculados (será usado quando não é consolidado)
  const dreCalculated = useMemo(() => calcularDREPorProduto(effectiveData), [effectiveData]);

  // Usa dados consolidados diretamente OU calcula a partir de effectiveData
  const {
    productMatrixData,
    caneProcessed,
    cornProcessed,
    caneMarginPerTon,
    cornMarginPerTon,
    receitasCana,
    receitasMilho,
    totalCornRevenuePerTon,
    caneTotalCost,
    sugarRevenuePerTon,
    hydratedEthanolCaneRevenuePerTon,
    anhydrousEthanolCaneRevenuePerTon,
    totalCaneRevenuePerTon,
    cornTotalCost,
    hydratedEthanolCornRevenuePerTon,
    anhydrousEthanolCornRevenuePerTon,
    ddgRevenuePerTon,
    wdgRevenuePerTon,
    unitCO2Cana,
    unitCBIOCana,
    receitaCO2Cana,
    receitaCBIOCana,
    unitCO2Milho,
    receitaCO2Milho,
    receitaCBIOMilho, 
    unitCBIOMilho,
    unitAdm, 
    custoAdm,
    despesasVCana,
    unitVCana,
    unitVMilho,
    despesasVEtanolMilho,
    resulCana, 
    resulMilho,
    rolEHC, 
    rolEAC,
  } = useMemo(() => {
    if (consolidatedData) {
      // Para visão consolidada, usar os valores totais de scenario.data
      const cane = consolidatedData.caneProcessed || 1; // Evita divisão por zero
      const corn = consolidatedData.cornProcessed || 1;
      
      // Receitas totais
      const receitaCanaTotal = consolidatedData.receitaCanaTotal || 0;
      const receitaMilhoTotal = consolidatedData.receitaMilhoTotal || 0;
      
      // Custos totais
      const custoCanaTotal = consolidatedData.custoCanaTotal || 0;
      const custoMilhoTotal = consolidatedData.custoMilhoTotal || 0;
      
      // Margens totais
      const margemCana = consolidatedData.margemCana || 0;
      const margemMilho = consolidatedData.margemMilho || 0;
      
      // Resultado operacional por tonelada
      const resulCanaPerTon = consolidatedData.caneProcessed > 0 
        ? (margemCana - (consolidatedData.despesasVendas * (consolidatedData.caneProcessed / (consolidatedData.caneProcessed + consolidatedData.cornProcessed))) - (consolidatedData.administracao * (consolidatedData.caneProcessed / (consolidatedData.caneProcessed + consolidatedData.cornProcessed)))) / consolidatedData.caneProcessed
        : 0;
      const resulMilhoPerTon = consolidatedData.cornProcessed > 0 
        ? (margemMilho - (consolidatedData.despesasVendas * (consolidatedData.cornProcessed / (consolidatedData.caneProcessed + consolidatedData.cornProcessed))) - (consolidatedData.administracao * (consolidatedData.cornProcessed / (consolidatedData.caneProcessed + consolidatedData.cornProcessed)))) / consolidatedData.cornProcessed
        : 0;

      return {
        productMatrixData: dreCalculated.productMatrixData,
        caneProcessed: consolidatedData.caneProcessed,
        cornProcessed: consolidatedData.cornProcessed,
        caneMarginPerTon: consolidatedData.caneProcessed > 0 ? margemCana / consolidatedData.caneProcessed : 0,
        cornMarginPerTon: consolidatedData.cornProcessed > 0 ? margemMilho / consolidatedData.cornProcessed : 0,
        receitasCana: {
          sugarRevenue: consolidatedData.receitaAcucarVHP,
          hydratedEthanolRevenue: consolidatedData.receitaEtanolHidratadoCana,
          anhydrousEthanolRevenue: consolidatedData.receitaEtanolAnidroCana,
        },
        receitasMilho: {
          hydratedEthanolCornRevenue: consolidatedData.receitaEtanolHidratadoMilho,
          anhydrousEthanolCornRevenue: consolidatedData.receitaEtanolAnidroMilho,
          ddgRevenue: consolidatedData.receitaDDG,
          wdgRevenue: consolidatedData.receitaWDG,
        },
        totalCornRevenuePerTon: consolidatedData.cornProcessed > 0 ? receitaMilhoTotal / consolidatedData.cornProcessed : 0,
        caneTotalCost: consolidatedData.caneProcessed > 0 ? custoCanaTotal / consolidatedData.caneProcessed : 0,
        sugarRevenuePerTon: consolidatedData.caneProcessed > 0 ? consolidatedData.receitaAcucarVHP / consolidatedData.caneProcessed : 0,
        hydratedEthanolCaneRevenuePerTon: consolidatedData.caneProcessed > 0 ? consolidatedData.receitaEtanolHidratadoCana / consolidatedData.caneProcessed : 0,
        anhydrousEthanolCaneRevenuePerTon: consolidatedData.caneProcessed > 0 ? consolidatedData.receitaEtanolAnidroCana / consolidatedData.caneProcessed : 0,
        totalCaneRevenuePerTon: consolidatedData.caneProcessed > 0 ? receitaCanaTotal / consolidatedData.caneProcessed : 0,
        cornTotalCost: consolidatedData.cornProcessed > 0 ? custoMilhoTotal / consolidatedData.cornProcessed : 0,
        hydratedEthanolCornRevenuePerTon: consolidatedData.cornProcessed > 0 ? consolidatedData.receitaEtanolHidratadoMilho / consolidatedData.cornProcessed : 0,
        anhydrousEthanolCornRevenuePerTon: consolidatedData.cornProcessed > 0 ? consolidatedData.receitaEtanolAnidroMilho / consolidatedData.cornProcessed : 0,
        ddgRevenuePerTon: consolidatedData.cornProcessed > 0 ? consolidatedData.receitaDDG / consolidatedData.cornProcessed : 0,
        wdgRevenuePerTon: consolidatedData.cornProcessed > 0 ? consolidatedData.receitaWDG / consolidatedData.cornProcessed : 0,
        unitCO2Cana: consolidatedData.caneProcessed > 0 ? consolidatedData.receitaCO2 / consolidatedData.caneProcessed : 0,
        unitCBIOCana: consolidatedData.caneProcessed > 0 ? consolidatedData.receitaCBIO / consolidatedData.caneProcessed : 0,
        receitaCO2Cana: consolidatedData.receitaCO2,
        receitaCBIOCana: consolidatedData.receitaCBIO,
        unitCO2Milho: 0,
        receitaCO2Milho: 0,
        receitaCBIOMilho: 0, 
        unitCBIOMilho: 0,
        unitAdm: (consolidatedData.caneProcessed + consolidatedData.cornProcessed) > 0 
          ? consolidatedData.administracao / (consolidatedData.caneProcessed + consolidatedData.cornProcessed) : 0,
        custoAdm: consolidatedData.administracao,
        despesasVCana: consolidatedData.despesasVendas * (consolidatedData.caneProcessed / (consolidatedData.caneProcessed + consolidatedData.cornProcessed || 1)),
        unitVCana: consolidatedData.caneProcessed > 0 
          ? (consolidatedData.despesasVendas * (consolidatedData.caneProcessed / (consolidatedData.caneProcessed + consolidatedData.cornProcessed || 1))) / consolidatedData.caneProcessed : 0,
        unitVMilho: consolidatedData.cornProcessed > 0 
          ? (consolidatedData.despesasVendas * (consolidatedData.cornProcessed / (consolidatedData.caneProcessed + consolidatedData.cornProcessed || 1))) / consolidatedData.cornProcessed : 0,
        despesasVEtanolMilho: consolidatedData.despesasVendas * (consolidatedData.cornProcessed / (consolidatedData.caneProcessed + consolidatedData.cornProcessed || 1)),
        resulCana: resulCanaPerTon,
        resulMilho: resulMilhoPerTon,
        rolEHC: consolidatedData.receitaEtanolHidratadoCana - (consolidatedData.impostosCana * (consolidatedData.receitaEtanolHidratadoCana / (consolidatedData.receitaCanaTotal || 1))),
        rolEAC: consolidatedData.receitaEtanolAnidroCana - (consolidatedData.impostosCana * (consolidatedData.receitaEtanolAnidroCana / (consolidatedData.receitaCanaTotal || 1))),
      };
    }
    return dreCalculated;
  }, [consolidatedData, dreCalculated]);

  // Label do cenário selecionado
  const scenarioLabel = useMemo(() => {
    if (selectedScenario === 'current') return 'Cenário Atual';
    if (selectedScenario === 'consolidated') return 'Visão Consolidada';
    const scenario = savedScenarios.find(s => s.id === selectedScenario);
    return scenario?.name || 'Cenário';
  }, [selectedScenario, savedScenarios]);

  const [scenarioName, setScenarioName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  };


  // Calcular margem bruta e resultado operacional para cada produto
  Object.keys(productMatrixData).forEach(product => {
    const prod = productMatrixData[product];
    prod.margemBruta = prod.receitaLiquida - prod.custoMateriaPrima - prod.custoCCT - prod.custoIndustria - prod.custoBiomassa;
    prod.resultadoOp = prod.margemBruta - prod.comercializacao - prod.administracao; 
  });

  // Nomes dos produtos para exibição
  const productNames = {
    sugarVHP: 'Açúcar VHP',
    ethanolHydratedCane: 'Etanol Hidratado Cana',
    ethanolAnhydrousCane: 'Etanol Anidro Cana',
    ethanolHydratedCorn: 'Etanol Hidratado Milho',
    ethanolAnhydrousCorn: 'Etanol Anidro Milho',
    ddg: 'DDG',
    wdg: 'WDG',
  };

  // Linhas da matriz DRE
  const matrixRows = [
    { key: 'receita', label: 'Receita' },
    { key: 'deducoes', label: 'Deduções' },
    { key: 'receitaLiquida', label: 'Receita Líquida' },
    { key: 'custoMateriaPrima', label: 'Matéria-prima' },
    { key: 'custoCCT', label: 'CCT' },
    { key: 'custoIndustria', label: 'Indústria' },
    { key: 'custoBiomassa', label: 'Biomassa' },
    { key: 'margemBruta', label: 'Margem Bruta' },
    { key: 'comercializacao', label: 'Comercialização' },
    { key: 'administracao', label: 'Administração' },
    { key: 'resultadoOp', label: 'Resultado Operacional' },
  ];

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error('Por favor, insira um nome para o cenário.');
      return;
    }

    saveScenario(scenarioName);
    setScenarioName('');
    setIsDialogOpen(false);
    toast.success('Cenário salvo com sucesso!');
  };

  const generatePDF = async () => {
    const element = document.getElementById('dre-content');
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
      const pageWidth = pdf.internal.pageSize.getWidth();   // 595.28
      const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89

      const margin = 20; // margem de 20pt (~7mm)

      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      // Calcula altura proporcional da imagem
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Se a imagem for mais alta que o espaço disponível, ajusta para caber
      const finalHeight = imgHeight > availableHeight ? availableHeight : imgHeight;

      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, finalHeight);
      pdf.save('DSP.pdf');
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <div className="space-y-6" >
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            DSP por Produto (R$/tonelada)
          </h1>
          <p className="text-muted-foreground">
            Demonstrativo de resultado separado entre Cana e Milho em valores por tonelada
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <ScenarioSelector
            selectedScenario={selectedScenario}
            onScenarioChange={setSelectedScenario}
            savedScenarios={savedScenarios}
          />
          {!isViewingOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Cenário
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle>Salvar Cenário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scenarioName">Nome do Cenário</Label>
                    <Input
                      id="scenarioName"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="Ex: Cenário Q1 2024"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveScenario}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button onClick={generatePDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div id="dre-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2" >
          {/* Cana de Açúcar */}
          <Card className="shadow-card">
            <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 justify-between">
                Cana de Açúcar
                <span  className="text-white text-2xl">
                  {formatNumber(caneProcessed)} ton processadas
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="grid grid-cols-3 gap-2 font-semibold text-green-700 border-b border-green-500 pb-2">
                  <span>Receita Liquida</span>
                  <span className="text-center">R$/ton</span>
                  <span className="text-center">R$ mil</span>
                </h3>
                <div className="space-y-3">

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>Açúcar VHP:</span>
                    <span className="text-center font-medium">{formatNumber(sugarRevenuePerTon)}</span>
                    <span className="text-center font-medium">{formatNumber(receitasCana.sugarRevenue / 1000)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>Etanol Hidratado:</span>
                    <span className="text-center font-medium">{formatNumber(hydratedEthanolCaneRevenuePerTon)}</span>
                    <span className="text-center font-medium">{formatNumber(rolEHC / 1000)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>Etanol Anidro:</span>
                    <span className="text-center font-medium">{formatNumber(anhydrousEthanolCaneRevenuePerTon)}</span>
                    <span className="text-center font-medium">{formatNumber(rolEAC / 1000)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>CO²:</span>
                    <span className="text-center font-medium">{formatNumber(unitCO2Cana)}</span>
                    <span className="text-center font-medium">{formatNumber(receitaCO2Cana / 1000)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>CBIO:</span>
                    <span className="text-center font-medium">{formatNumber(unitCBIOCana)}</span>
                    <span className="text-center font-medium">{formatNumber(receitaCBIOCana / 1000)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center font-bold text-green-700 ">
                    <span>Total:</span>
                    <span className="text-center">{formatNumber(totalCaneRevenuePerTon)}</span>
                    <span className="text-center">{formatNumber((receitasCana.sugarRevenue + rolEAC + rolEHC + receitaCO2Cana + receitaCBIOCana) / 1000)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-red-700 border-b border-red-200 pb-2">
                  Custos
                </h3>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Matéria-prima:</span>
                  <span className="text-center font-medium">{formatNumber(effectiveData.productionCosts.caneRawMaterial)}</span>
                  <span className="text-center font-medium">{formatNumber((effectiveData.productionCosts.caneRawMaterial * caneProcessed) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>CCT:</span>
                  <span className="text-center font-medium">{formatNumber(effectiveData.productionCosts.caneCct)}</span>
                  <span className="text-center font-medium">{formatNumber((effectiveData.productionCosts.caneCct * caneProcessed) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Indústria:</span>
                  <span className="text-center font-medium">{formatNumber(effectiveData.productionCosts.caneIndustry)}</span>
                  <span className="text-center font-medium">{formatNumber((effectiveData.productionCosts.caneIndustry * caneProcessed) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Dispêndios:</span>
                  <span className="text-center font-medium">{formatNumber(effectiveData.productionCosts.caneExpenses)}</span>
                  <span className="text-center font-medium">{formatNumber((effectiveData.productionCosts.caneExpenses * caneProcessed) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center font-bold text-red-700">
                  <span>Total:</span>
                  <span className="text-center">{formatNumber(caneTotalCost)}</span>
                  <span className="text-center">{formatNumber((caneTotalCost * caneProcessed) / 1000)}</span>
                </div>


                <div className={`grid grid-cols-3 gap-2 items-center font-bold text-lg ${caneMarginPerTon >= 0 ? 'text-green-600' : 'text-red-600'} border-t border-green-500 pt-2`}>
                  <span>Margem:</span>
                  <span className="text-center">{formatNumber(caneMarginPerTon)}</span>
                  <span className="text-center">{formatNumber((caneMarginPerTon * caneProcessed) / 1000)}</span>
                </div>
                 <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Despesas com Vendas:</span>
                  <span className="text-center font-medium">{formatNumber(unitVCana)}</span>
                  <span className="text-center font-medium">{formatNumber((despesasVCana) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Administrativo:</span>
                  <span className="text-center font-medium">{formatNumber(unitAdm)}</span>
                  <span className="text-center font-medium">{formatNumber((custoAdm) / 1000)}</span>
                </div>

                <div className={`grid grid-cols-3 gap-2 items-center font-bold text-lg ${caneMarginPerTon >= 0 ? 'text-green-600' : 'text-red-600'} border-t border-green-500 pt-2`}>
                  <span>Resultado:</span>
                  <span className="text-center">{formatNumber(resulCana)}</span>
                  <span className="text-center">{formatNumber((resulCana * caneProcessed) / 1000)}</span>
                </div>
                
              </div>

            </CardContent>
          </Card>

          {/* Milho */}
          <Card className="shadow-card">
            <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 justify-between">
                Milho
                <span  className="text-white text-2xl">
                  {formatNumber(cornProcessed)} ton processadas
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="grid grid-cols-3 gap-2 font-semibold text-green-700 border-b border-green-500 pb-2">
                  <span>Receita Liquida</span>
                  <span className="text-center">R$/ton</span>
                  <span className="text-center">R$ mil</span>
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>Etanol Hidratado:</span>
                    <span className="text-center font-medium">{formatNumber(hydratedEthanolCornRevenuePerTon)}</span>
                    <span className="text-center font-medium">{formatNumber(receitasMilho.hydratedEthanolCornRevenue / 1000)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>Etanol Anidro:</span>
                    <span className="text-center font-medium">{formatNumber(anhydrousEthanolCornRevenuePerTon)}</span>
                    <span className="text-center font-medium">{formatNumber(receitasMilho.anhydrousEthanolCornRevenue / 1000)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>DDG:</span>
                    <span className="text-center font-medium">{formatNumber(ddgRevenuePerTon)}</span>
                    <span className="text-center font-medium">{formatNumber(receitasMilho.ddgRevenue / 1000)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>WDG:</span>
                    <span className="text-center font-medium">{formatNumber(wdgRevenuePerTon)}</span>
                    <span className="text-center font-medium">{formatNumber(receitasMilho.wdgRevenue / 1000)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>CO²:</span>
                    <span className="text-center font-medium">{formatNumber(unitCO2Milho)}</span>
                    <span className="text-center font-medium">{formatNumber(receitaCO2Milho / 1000)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span>CBIO:</span>
                    <span className="text-center font-medium">{formatNumber(unitCBIOMilho)}</span>
                    <span className="text-center font-medium">{formatNumber(receitaCBIOMilho / 1000)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center font-bold text-green-700 ">
                    <span>Total:</span>
                    <span className="text-center">{formatNumber(totalCornRevenuePerTon)}</span>
                    <span className="text-center">{formatNumber((receitasMilho.hydratedEthanolCornRevenue + receitasMilho.anhydrousEthanolCornRevenue + receitasMilho.ddgRevenue + receitasMilho.wdgRevenue + receitaCO2Milho + receitaCBIOMilho) / 1000)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-red-700 border-b border-red-200 pb-2">
                  Custos
                </h3>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Matéria-prima:</span>
                  <span className="text-center font-medium">{formatNumber(effectiveData.productionCosts.cornRawMaterial)}</span>
                  <span className="text-center font-medium">{formatNumber((effectiveData.productionCosts.cornRawMaterial * cornProcessed) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Indústria:</span>
                  <span className="text-center font-medium">{formatNumber(effectiveData.productionCosts.cornIndustry)}</span>
                  <span className="text-center font-medium">{formatNumber((effectiveData.productionCosts.cornIndustry * cornProcessed) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Biomassa:</span>
                  <span className="text-center font-medium">{formatNumber(effectiveData.productionCosts.cornBiomass)}</span>
                  <span className="text-center font-medium">{formatNumber((effectiveData.productionCosts.cornBiomass * cornProcessed) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center font-bold text-red-700">
                  <span>Total:</span>
                  <span className="text-center">{formatNumber(cornTotalCost)}</span>
                  <span className="text-center">{formatNumber((cornTotalCost * cornProcessed) / 1000)}</span>
                </div>
                <div className={`grid grid-cols-3 gap-2 items-center font-bold text-lg ${cornMarginPerTon >= 0 ? 'text-green-600' : 'text-red-600'} border-t border-green-500 pt-2`}>
                  <span>Margem:</span>
                  <span className="text-center">{formatNumber(cornMarginPerTon)}</span>
                  <span className="text-center">{formatNumber((cornMarginPerTon * cornProcessed) / 1000)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span>Despesas com Vendas:</span>
                  <span className="text-center font-medium">{formatNumber(unitVMilho)}</span>
                  <span className="text-center font-medium">{formatNumber(despesasVEtanolMilho / 1000)}</span>
                </div>

                <div className={`grid grid-cols-3 gap-2 items-center font-bold text-lg ${caneMarginPerTon >= 0 ? 'text-green-600' : 'text-red-600'} border-t border-green-500 pt-2`}>
                  <span>Resultado:</span>
                  <span className="text-center">{formatNumber(resulMilho)}</span>
                  <span className="text-center">{formatNumber((resulMilho * cornProcessed) / 1000)}</span>
                </div>
              </div>


            </CardContent>
          </Card>
        </div>
        {/* Matriz DRE por Produto */}
        <Card className="shadow-card mb-2">
          <CardHeader>
            <CardTitle>Matriz DSP por Produto (R$ mil)</CardTitle>
            <CardDescription>Análise detalhada de receitas, custos e margens por produto</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="w-32 text-left p-3 font-semibold text-sm bg-muted/50 sticky left-0 z-10">
                      Indicador
                    </th>
                    {Object.keys(productNames).map((key) => (
                      <th key={key} className="w-24 text-center p-2 font-semibold text-10 bg-muted/50">
                        {productNames[key as keyof typeof productNames]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row, index) => (
                    <tr key={row.key} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${row.key === 'receitaLiquida' || row.key === 'margemBruta' || row.key === 'ebitda'
                      ? 'bg-accent/20 font-medium' : ''
                      }`}>
                      <td className="p-3 font-medium text-10 bg-background/95 sticky left-0 z-10 border-r border-border/30">
                        {row.label}
                      </td>
                      {Object.keys(productMatrixData).map((productKey) => {
                        const value = productMatrixData[productKey][row.key as keyof ProductData];
                        const isNegative = value < 0;
                        const isPositive = value > 0;
                        const isZero = value === 0;

                        // Determinar cor baseada no tipo de linha e valor
                        let colorClass = 'text-foreground';
                        if (row.key === 'deducoes' || row.key === 'comercializacao' ||
                          row.key === 'custoMateriaPrima' || row.key === 'custoCCT' ||
                          row.key === 'custoIndustria' || row.key === 'administracao') {
                          colorClass = 'text-red-600';
                        } else if (row.key === 'receita' || row.key === 'receitaLiquida') {
                          colorClass = 'text-blue-600';
                        } else if (row.key === 'margemBruta' || row.key === 'ebitda') {
                          colorClass = isNegative ? 'text-red-600' : 'text-green-600';
                        }

                        return (
                          <td key={productKey} className={`p-2 text-center text-10 ${colorClass} ${row.key === 'receitaLiquida' || row.key === 'margemBruta' || row.key === 'ebitda'
                            ? 'font-semibold' : ''
                            }`}>
                            {isZero ? '-' : `${formatNumber(Math.abs(value))}`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>Custos e Deduções</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>Margens Positivas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded"></div>
                <span>Linhas Principais</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Comparativo */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Resumo Comparativo</CardTitle>
            <CardDescription>Comparação de margens entre Cana e Milho</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700">Cana de Açúcar</h3>
                <div className={`text-2xl font-bold ${caneMarginPerTon >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatNumber(caneMarginPerTon)}/ton
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-orange-700">Milho</h3>
                <div className={`text-2xl font-bold ${cornMarginPerTon >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatNumber(cornMarginPerTon)}/ton
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Diferença</h3>
                <div className={`text-2xl font-bold ${(caneMarginPerTon - cornMarginPerTon) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(formatNumber(caneMarginPerTon - cornMarginPerTon))}/ton
                </div>
                <div className="text-sm text-muted-foreground">
                  {caneMarginPerTon > cornMarginPerTon ? 'Cana mais rentável' : 'Milho mais rentável'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DREByProduct;