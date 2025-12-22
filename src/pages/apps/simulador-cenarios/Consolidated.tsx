import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSimulator, SavedScenario } from '@/contexts/SimulatorContext';
import { Download, Save, Trash2, Plus, RefreshCw, Pencil, Upload, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function Consolidated() {
  const { savedScenarios, saveScenario, deleteScenario, updateAllScenarios, refreshScenario, loadScenarioForEditing, importMultipleScenarios } = useSimulator();
  const [scenarioName, setScenarioName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para exportar TODOS os cenários como JSON
  const exportAllScenariosToJson = () => {
    if (savedScenarios.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há cenários para exportar.",
        variant: "destructive",
      });
      return;
    }
    
    const dataStr = JSON.stringify(savedScenarios, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cenarios-simulador-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Sucesso",
      description: `${savedScenarios.length} cenário(s) exportado(s) com sucesso!`,
    });
  };

  // Função para importar cenários de arquivo JSON (aceita array ou objeto único)
  const handleImportScenarios = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Verifica se é um array (múltiplos cenários) ou objeto único
        const scenariosArray = Array.isArray(data) ? data : [data];
        
        const result = importMultipleScenarios(scenariosArray);
        
        if (result.success) {
          toast({
            title: "Sucesso",
            description: `${result.count} cenário(s) importado(s) com sucesso!`,
          });
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao importar cenários",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Arquivo JSON inválido",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Limpa o input para permitir reimportar o mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para calcular o total de um indicador específico
  const calculateTotal = (getValue: (scenario: any) => number, formatAsCurrency: boolean = false) => {
    if (savedScenarios.length === 0) return 0;
    
    const total = savedScenarios.reduce((sum, scenario) => sum + getValue(scenario), 0);
    
    if (formatAsCurrency) {
      return total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    return total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Função para calcular o total de um indicador específico (valor numérico para cálculos)
  const calculateTotalValue = (getValue: (scenario: any) => number) => {
    if (savedScenarios.length === 0) return 0;
    return savedScenarios.reduce((sum, scenario) => sum + getValue(scenario), 0);
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para o cenário.",
        variant: "destructive",
      });
      return;
    }

    const result = saveScenario(scenarioName);

    if (result.success) {
      setScenarioName('');
      setIsDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Cenário salvo com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: `Erro ao salvar cenário: ${result.error}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteScenario = (id: string) => {
    deleteScenario(id);
    toast({
      title: "Sucesso",
      description: "Cenário removido com sucesso!",
    });
  };

  const handleUpdateAllScenarios = () => {
    updateAllScenarios();
    toast({
      title: "Sucesso",
      description: "Todos os cenários foram atualizados com os novos cálculos!",
    });
  };

  const handleRefreshScenario = (id: string) => {
    refreshScenario(id);
    toast({
      title: "Sucesso",
      description: "Cenário atualizado com sucesso!",
    });
  };

  const handleEditScenario = (id: string, scenarioName: string) => {
    const success = loadScenarioForEditing(id);
    if (success) {
      toast({
        title: "Cenário carregado",
        description: `Os dados de "${scenarioName}" foram carregados. Edite e clique em "Atualizar" quando terminar.`,
      });
      navigate('/apps/simulador-cenarios/sugarcane-premises');
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o cenário. Tente salvá-lo novamente.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    if (savedScenarios.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há cenários salvos para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Função auxiliar para calcular totais como número puro
    const calcTotalNum = (fn: (s: typeof savedScenarios[0]) => number): number => {
      return savedScenarios.reduce((sum, s) => sum + fn(s), 0);
    };

    // Criar dados para exportação incluindo a coluna de total (valores numéricos puros)
    const exportData = [
      ['Indicador', ...savedScenarios.map(s => s.name), 'Total'],
      ['Data', ...savedScenarios.map(s => s.date), ''],
      ['', ...Array(savedScenarios.length + 1).fill('')],
      ['PREMISSAS', ...Array(savedScenarios.length + 1).fill('')],
      ['CANA', ...Array(savedScenarios.length + 1).fill('')],
      ['  Cana Moída Total (ton)', ...savedScenarios.map(s => s.data.premissaCanaMoidaTotal || 0), calcTotalNum(s => s.data.premissaCanaMoidaTotal || 0)],
      ['  Mix Açúcar (%)', ...savedScenarios.map(s => s.data.premissaCanaMixAcucar || 0), '-'],
      ['  Mix Etanol (%)', ...savedScenarios.map(s => s.data.premissaCanaMixEtanol || 0), '-'],
      ['  ATR (kg/ton)', ...savedScenarios.map(s => s.data.premissaCanaATR || 0), '-'],
      ['  Rendimento VHP (kg/t)', ...savedScenarios.map(s => s.data.premissaCanaRendimentoVHP || 0), '-'],
      ['  Rendimento EHC (L/t)', ...savedScenarios.map(s => s.data.premissaCanaRendimentoEHC || 0), '-'],
      ['  Rendimento EAC (L/t)', ...savedScenarios.map(s => s.data.premissaCanaRendimentoEAC || 0), '-'],
      ['MILHO', ...Array(savedScenarios.length + 1).fill('')],
      ['  Rendimento Total Convertido (L/ton)', ...savedScenarios.map(s => s.data.premissaMilhoRendimentoConvertido || 0), '-'],
      ['  Rendimento DDG (kg/ton)', ...savedScenarios.map(s => s.data.premissaMilhoRendimentoDDG || 0), '-'],
      ['  Rendimento WDG (kg/ton)', ...savedScenarios.map(s => s.data.premissaMilhoRendimentoWDG || 0), '-'],
      ['', ...Array(savedScenarios.length + 1).fill('')],
      ['PRODUÇÕES', ...Array(savedScenarios.length + 1).fill('')],
      ['Açúcar VHP (ton)', ...savedScenarios.map(s => s.data.sugarProduction), calcTotalNum(s => s.data.sugarProduction)],
      ['Etanol Hidratado Cana (m³)', ...savedScenarios.map(s => s.data.hydratedEthanolCane), calcTotalNum(s => s.data.hydratedEthanolCane)],
      ['Etanol Hidratado Milho (m³)', ...savedScenarios.map(s => s.data.hydratedEthanolCorn), calcTotalNum(s => s.data.hydratedEthanolCorn)],
      ['Etanol Anidro Cana (m³)', ...savedScenarios.map(s => s.data.anhydrousEthanolCane), calcTotalNum(s => s.data.anhydrousEthanolCane)],
      ['Etanol Anidro Milho (m³)', ...savedScenarios.map(s => s.data.anhydrousEthanolCorn), calcTotalNum(s => s.data.anhydrousEthanolCorn)],
      ['DDG (ton)', ...savedScenarios.map(s => s.data.ddgProduction), calcTotalNum(s => s.data.ddgProduction)],
      ['WDG (ton)', ...savedScenarios.map(s => s.data.wdgProduction), calcTotalNum(s => s.data.wdgProduction)],
      ['', ...Array(savedScenarios.length + 1).fill('')],
      ['PREÇOS LÍQUIDOS', ...Array(savedScenarios.length + 1).fill('')],
      ['Açúcar VHP (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoVHP), '-'],
      ['Etanol Hidratado Cana (R$/m³)', ...savedScenarios.map(s => s.data.precoLiquidoEtanolHidratadoCana), '-'],
      ['Etanol Hidratado Milho (R$/m³)', ...savedScenarios.map(s => s.data.precoLiquidoEtanolHidratadoMilho), '-'],
      ['Etanol Anidro Cana (R$/m³)', ...savedScenarios.map(s => s.data.precoLiquidoEtanolAnidroCana), '-'],
      ['Etanol Anidro Milho (R$/m³)', ...savedScenarios.map(s => s.data.precoLiquidoEtanolAnidroMilho), '-'],
      ['DDG (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoDDG), '-'],
      ['WDG (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoWDG), '-'],
      ['CO2 (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoCO2), '-'],
      ['CBIO (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoCBIO), '-'],
      ['', ...Array(savedScenarios.length + 1).fill('')],
      ['CUSTOS DE PRODUÇÃO', ...Array(savedScenarios.length + 1).fill('')],
      ['CANA (R$/ton cana)', ...Array(savedScenarios.length + 1).fill('')],
      ['  Matéria-prima (R$/ton)', ...savedScenarios.map(s => s.data.custoCanaUnitarioMateriaPrima || 0), '-'],
      ['  CCT (R$/ton)', ...savedScenarios.map(s => s.data.custoCanaUnitarioCCT || 0), '-'],
      ['  Indústria (R$/ton)', ...savedScenarios.map(s => s.data.custoCanaUnitarioIndustria || 0), '-'],
      ['  Dispêndios (R$/ton)', ...savedScenarios.map(s => s.data.custoCanaUnitarioDispendios || 0), '-'],
      ['  Total Cana (R$/ton)', ...savedScenarios.map(s => s.data.custoCanaUnitarioTotal || 0), '-'],
      ['MILHO (R$/ton milho)', ...Array(savedScenarios.length + 1).fill('')],
      ['  Matéria-prima (R$/ton)', ...savedScenarios.map(s => s.data.custoMilhoUnitarioMateriaPrima || 0), '-'],
      ['  Indústria (R$/ton)', ...savedScenarios.map(s => s.data.custoMilhoUnitarioIndustria || 0), '-'],
      ['  Biomassa (R$/ton)', ...savedScenarios.map(s => s.data.custoMilhoUnitarioBiomassa || 0), '-'],
      ['  Total Milho (R$/ton)', ...savedScenarios.map(s => s.data.custoMilhoUnitarioTotal || 0), '-'],
      ['', ...Array(savedScenarios.length + 1).fill('')],
      ['CUSTOS DE PRODUTOS VENDIDOS', ...Array(savedScenarios.length + 1).fill('')],
      ['CANA', ...Array(savedScenarios.length + 1).fill('')],
      ['  Açúcar VHP (R$/ton)', ...savedScenarios.map(s => s.data.cpvAcucarVHP || 0), '-'],
      ['  Etanol Hidratado - EHC (R$/m³)', ...savedScenarios.map(s => s.data.cpvEHC || 0), '-'],
      ['  Etanol Anidro - EAC (R$/m³)', ...savedScenarios.map(s => s.data.cpvEAC || 0), '-'],
      ['MILHO', ...Array(savedScenarios.length + 1).fill('')],
      ['  Etanol Hidratado - EHM (R$/m³)', ...savedScenarios.map(s => s.data.cpvEHM || 0), '-'],
      ['  Etanol Anidro - EAM (R$/m³)', ...savedScenarios.map(s => s.data.cpvEAM || 0), '-'],
      ['  DDG (R$/ton)', ...savedScenarios.map(s => s.data.cpvDDG || 0), '-'],
      ['  WDG (R$/ton)', ...savedScenarios.map(s => s.data.cpvWDG || 0), '-'],
      ['', ...Array(savedScenarios.length + 1).fill('')],
      ['RESULTADOS FINANCEIROS', ...Array(savedScenarios.length + 1).fill('')],
      ['Receita Total (R$)', ...savedScenarios.map(s => s.data.totalRevenue), calcTotalNum(s => s.data.totalRevenue)],
      ['  Receita Cana Total (R$)', ...savedScenarios.map(s => s.data.receitaCanaTotal || 0), calcTotalNum(s => s.data.receitaCanaTotal || 0)],
      ['    Açúcar VHP (R$)', ...savedScenarios.map(s => s.data.receitaAcucarVHP), calcTotalNum(s => s.data.receitaAcucarVHP)],
      ['    Etanol Hidratado (R$)', ...savedScenarios.map(s => s.data.receitaEtanolHidratadoCana), calcTotalNum(s => s.data.receitaEtanolHidratadoCana)],
      ['    Etanol Anidro (R$)', ...savedScenarios.map(s => s.data.receitaEtanolAnidroCana), calcTotalNum(s => s.data.receitaEtanolAnidroCana)],
      ['  Receita Milho Total (R$)', ...savedScenarios.map(s => s.data.receitaMilhoTotal || 0), calcTotalNum(s => s.data.receitaMilhoTotal || 0)],
      ['    Etanol Hidratado (R$)', ...savedScenarios.map(s => s.data.receitaEtanolHidratadoMilho), calcTotalNum(s => s.data.receitaEtanolHidratadoMilho)],
      ['    Etanol Anidro (R$)', ...savedScenarios.map(s => s.data.receitaEtanolAnidroMilho), calcTotalNum(s => s.data.receitaEtanolAnidroMilho)],
      ['    DDG (R$)', ...savedScenarios.map(s => s.data.receitaDDG), calcTotalNum(s => s.data.receitaDDG)],
      ['    WDG (R$)', ...savedScenarios.map(s => s.data.receitaWDG), calcTotalNum(s => s.data.receitaWDG)],
      ['CO2 (R$)', ...savedScenarios.map(s => s.data.receitaCO2), calcTotalNum(s => s.data.receitaCO2)],
      ['CBIO (R$)', ...savedScenarios.map(s => s.data.receitaCBIO), calcTotalNum(s => s.data.receitaCBIO)],
      ['Derivativos/Câmbio (R$)', ...savedScenarios.map(s => s.data.derivativosCambio), calcTotalNum(s => s.data.derivativosCambio)],
      ['Impostos (R$)', ...savedScenarios.map(s => s.data.impostos), calcTotalNum(s => s.data.impostos)],
      ['  Impostos Cana (R$)', ...savedScenarios.map(s => s.data.impostosCana || 0), calcTotalNum(s => s.data.impostosCana || 0)],
      ['  Impostos Milho (R$)', ...savedScenarios.map(s => s.data.impostosMilho || 0), calcTotalNum(s => s.data.impostosMilho || 0)],
      ['Receita Líquida (R$)', ...savedScenarios.map(s => s.data.receitaLiquida), calcTotalNum(s => s.data.receitaLiquida)],
      ['  Receita Líquida Cana (R$)', ...savedScenarios.map(s => s.data.receitaLiquidaCana || 0), calcTotalNum(s => s.data.receitaLiquidaCana || 0)],
      ['  Receita Líquida Milho (R$)', ...savedScenarios.map(s => s.data.receitaLiquidaMilho || 0), calcTotalNum(s => s.data.receitaLiquidaMilho || 0)],
      ['  Receita Líquida Outras (R$)', ...savedScenarios.map(s => s.data.receitaLiquidaOutras || 0), calcTotalNum(s => s.data.receitaLiquidaOutras || 0)],
      ['CPV Total (R$)', ...savedScenarios.map(s => s.data.cpvTotal), calcTotalNum(s => s.data.cpvTotal)],
      ['  Custo Cana Total (R$)', ...savedScenarios.map(s => s.data.custoCanaTotal), calcTotalNum(s => s.data.custoCanaTotal)],
      ['    Açúcar VHP (R$)', ...savedScenarios.map(s => s.data.cpvTotalAcucarVHP || 0), calcTotalNum(s => s.data.cpvTotalAcucarVHP || 0)],
      ['    Etanol Hidratado (R$)', ...savedScenarios.map(s => s.data.cpvTotalEHC || 0), calcTotalNum(s => s.data.cpvTotalEHC || 0)],
      ['    Etanol Anidro (R$)', ...savedScenarios.map(s => s.data.cpvTotalEAC || 0), calcTotalNum(s => s.data.cpvTotalEAC || 0)],
      ['  Custos Milho Total (R$)', ...savedScenarios.map(s => s.data.custoMilhoTotal), calcTotalNum(s => s.data.custoMilhoTotal)],
      ['    Etanol Hidratado (R$)', ...savedScenarios.map(s => s.data.cpvTotalEHM || 0), calcTotalNum(s => s.data.cpvTotalEHM || 0)],
      ['    Etanol Anidro (R$)', ...savedScenarios.map(s => s.data.cpvTotalEAM || 0), calcTotalNum(s => s.data.cpvTotalEAM || 0)],
      ['    DDG (R$)', ...savedScenarios.map(s => s.data.cpvTotalDDG || 0), calcTotalNum(s => s.data.cpvTotalDDG || 0)],
      ['    WDG (R$)', ...savedScenarios.map(s => s.data.cpvTotalWDG || 0), calcTotalNum(s => s.data.cpvTotalWDG || 0)],
      ['Margem de Contribuição (R$)', ...savedScenarios.map(s => s.data.margemContribuicao), calcTotalNum(s => s.data.margemContribuicao)],
      ['  Margem Cana (R$)', ...savedScenarios.map(s => s.data.margemCana || 0), calcTotalNum(s => s.data.margemCana || 0)],
      ['  Margem Milho (R$)', ...savedScenarios.map(s => s.data.margemMilho || 0), calcTotalNum(s => s.data.margemMilho || 0)],
      ['  Margem Outras (R$)', ...savedScenarios.map(s => s.data.margemOutras || 0), calcTotalNum(s => s.data.margemOutras || 0)],
      ['Despesas com Vendas (R$)', ...savedScenarios.map(s => s.data.despesasVendas), calcTotalNum(s => s.data.despesasVendas)],
      ['Administração (R$)', ...savedScenarios.map(s => s.data.administracao), calcTotalNum(s => s.data.administracao)],
      ['Resultado Operacional (R$)', ...savedScenarios.map(s => s.data.resultadoOperacional), calcTotalNum(s => s.data.resultadoOperacional)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cenários Consolidados');

    // Salvar arquivo
    XLSX.writeFile(wb, `cenarios_consolidados_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Sucesso",
      description: "Planilha exportada com sucesso!",
    });
  };

  
  const generatePDF = async () => {
    const element = document.getElementById('dre-content');
    if (!element) {
      toast({ title: "Erro", description: "Erro ao gerar PDF", variant: "destructive" });
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
      pdf.save('Consolidado.pdf');
      toast({ title: "Sucesso", description: "PDF gerado com sucesso!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-start items-center">
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Salvar Cenário Atual
              </Button>
            </DialogTrigger>
            <DialogContent>
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

          {/* <Button
            variant="outline"
            onClick={handleUpdateAllScenarios}
            disabled={savedScenarios.length === 0}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Todos
          </Button> */}

          {/* Input escondido para importar arquivo */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportScenarios}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar Cenários
          </Button>

          <Button
            variant="outline"
            onClick={exportAllScenariosToJson}
            disabled={savedScenarios.length === 0}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exportar Cenários
          </Button>

          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={savedScenarios.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            onClick={generatePDF}
            disabled={savedScenarios.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {savedScenarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum cenário salvo</h3>
              <p className="text-muted-foreground mb-4">
                Salve cenários de simulação para compará-los aqui
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Salvar Primeiro Cenário
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card id="dre-content">
         
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="align-bottom h-20 text-xl"> {/* h-20 opcional */}
                    <TableHead className="font-semibold">Indicador</TableHead>

                    {savedScenarios.map((scenario) => (
                      <TableHead
                        key={scenario.id}
                        className="min-w-[150px] align-bottom"   // tire o text-center daqui
                      >
                        {/* coluna centrada */}
                        <div className="flex flex-col items-center">
                          <div className="font-semibold leading-tight text-xl">{scenario.name}</div>
                          

                          {/* agora os botões realmente no centro */}
                          <div className="mt-1 flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefreshScenario(scenario.id)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Atualizar cenário"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditScenario(scenario.id, scenario.name)}
                              className="text-amber-600 hover:text-amber-700"
                              title="Editar cenário"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteScenario(scenario.id)}
                              className="text-destructive hover:text-destructive"
                              title="Excluir cenário"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                    ))}

                    {/* Coluna de Total */}
                    <TableHead className="min-w-[150px]  bg-muted/30">
                      <div className="flex flex-col items-center">
                        <div className="font-semibold leading-tight text-primary">Consolidado</div>
                        
                      </div>
                    </TableHead>
                    
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* PREMISSAS */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={savedScenarios.length + 2}>
                      PREMISSAS
                    </TableCell>
                  </TableRow>
                  
                  {/* CANA */}
                  <TableRow className="bg-green-50/50 dark:bg-green-900/10">
                    <TableCell className="font-semibold pl-4" colSpan={savedScenarios.length + 2}>
                      CANA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Cana Moída Total (ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaCanaMoidaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {savedScenarios.reduce((sum, s) => sum + (s.data.premissaCanaMoidaTotal || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Mix Açúcar (%)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaCanaMixAcucar || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Mix Etanol (%)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaCanaMixEtanol || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">ATR (kg/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaCanaATR || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Rendimento VHP (kg/t)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaCanaRendimentoVHP || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Rendimento EHC (L/t)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaCanaRendimentoEHC || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Rendimento EAC (L/t)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaCanaRendimentoEAC || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  {/* MILHO */}
                  <TableRow className="bg-yellow-50/50 dark:bg-yellow-900/10">
                    <TableCell className="font-semibold pl-4" colSpan={savedScenarios.length + 2}>
                      MILHO
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Rendimento Total Convertido (L/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaMilhoRendimentoConvertido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Rendimento DDG (kg/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaMilhoRendimentoDDG || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6">Rendimento WDG (kg/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {(scenario.data.premissaMilhoRendimentoWDG || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  {/* PRODUÇÕES */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={savedScenarios.length + 2}>
                      PRODUÇÕES
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Açúcar VHP (ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {scenario.data.sugarProduction.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {calculateTotal(s => s.data.sugarProduction)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol Hidratado Cana (m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {scenario.data.hydratedEthanolCane.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {calculateTotal(s => s.data.hydratedEthanolCane)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol Hidratado Milho (m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {scenario.data.hydratedEthanolCorn.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {calculateTotal(s => s.data.hydratedEthanolCorn)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol Anidro Cana (m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {scenario.data.anhydrousEthanolCane.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {calculateTotal(s => s.data.anhydrousEthanolCane)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol Anidro Milho (m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {scenario.data.anhydrousEthanolCorn.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {calculateTotal(s => s.data.anhydrousEthanolCorn)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">DDG (ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {scenario.data.ddgProduction.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {calculateTotal(s => s.data.ddgProduction)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">WDG (ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        {scenario.data.wdgProduction.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {calculateTotal(s => s.data.wdgProduction)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={savedScenarios.length + 2}>
                      PREÇOS LÍQUIDOS
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Açúcar VHP (R$/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoVHP.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol Hidratado Cana (R$/m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoEtanolHidratadoCana.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol Hidratado Milho (R$/m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoEtanolHidratadoMilho.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol Anidro Cana (R$/m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoEtanolAnidroCana.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol Anidro Milho (R$/m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoEtanolAnidroMilho.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">DDG (R$/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoDDG.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">WDG (R$/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoWDG.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CO2 (R$/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoCO2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CBIO (R$/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.precoLiquidoCBIO.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      -
                    </TableCell>
                  </TableRow>

                  {/* ============ CUSTOS DE PRODUÇÃO ============ */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={savedScenarios.length + 2}>
                      CUSTOS DE PRODUÇÃO
                    </TableCell>
                  </TableRow>

                  {/* === CANA === */}
                  <TableRow className="bg-blue-50/50 dark:bg-blue-900/10">
                    <TableCell className="font-semibold pl-4" colSpan={savedScenarios.length + 2}>
                      CANA (R$/ton cana)
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Matéria-prima</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.custoCanaUnitarioMateriaPrima || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">CCT</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.custoCanaUnitarioCCT || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Indústria</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.custoCanaUnitarioIndustria || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Dispêndios</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.custoCanaUnitarioDispendios || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow className="bg-blue-50/30 dark:bg-blue-900/5">
                    <TableCell className="font-semibold pl-6">Total Cana</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center font-semibold">
                        R$ {(scenario.data.custoCanaUnitarioTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  {/* === MILHO === */}
                  <TableRow className="bg-yellow-50/50 dark:bg-yellow-900/10">
                    <TableCell className="font-semibold pl-4" colSpan={savedScenarios.length + 2}>
                      MILHO (R$/ton milho)
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Matéria-prima</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.custoMilhoUnitarioMateriaPrima || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Indústria</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.custoMilhoUnitarioIndustria || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Biomassa</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.custoMilhoUnitarioBiomassa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow className="bg-yellow-50/30 dark:bg-yellow-900/5">
                    <TableCell className="font-semibold pl-6">Total Milho</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center font-semibold">
                        R$ {(scenario.data.custoMilhoUnitarioTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  {/* ============ CUSTOS DE PRODUTOS VENDIDOS ============ */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={savedScenarios.length + 2}>
                      CUSTOS DE PRODUTOS VENDIDOS
                    </TableCell>
                  </TableRow>

                  {/* === CANA === */}
                  <TableRow className="bg-blue-50/50 dark:bg-blue-900/10">
                    <TableCell className="font-semibold pl-4" colSpan={savedScenarios.length + 2}>
                      CANA
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Açúcar VHP (R$/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.cpvAcucarVHP || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Etanol Hidratado - EHC (R$/m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.cpvEHC || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Etanol Anidro - EAC (R$/m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.cpvEAC || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  {/* === MILHO === */}
                  <TableRow className="bg-yellow-50/50 dark:bg-yellow-900/10">
                    <TableCell className="font-semibold pl-4" colSpan={savedScenarios.length + 2}>
                      MILHO
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Etanol Hidratado - EHM (R$/m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.cpvEHM || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">Etanol Anidro - EAM (R$/m³)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.cpvEAM || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">DDG (R$/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.cpvDDG || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium pl-6">WDG (R$/ton)</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {(scenario.data.cpvWDG || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">-</TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={savedScenarios.length + 2}>
                      RESULTADOS FINANCEIROS
                    </TableCell>
                  </TableRow>
                  {/* Receita Total com estrutura hierárquica */}
                  <TableRow>
                    <TableCell className="font-medium">Receita Total</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.totalRevenue)}
                    </TableCell>
                  </TableRow>

                  {/* Receita Cana Total */}
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Receita Cana Total</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {(scenario.data.receitaCanaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaCanaTotal || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Açúcar VHP</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.receitaAcucarVHP.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaAcucarVHP)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Etanol Hidratado</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.receitaEtanolHidratadoCana.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaEtanolHidratadoCana)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Etanol Anidro</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.receitaEtanolAnidroCana.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaEtanolAnidroCana)}
                    </TableCell>
                  </TableRow>

                  {/* Receita Milho Total */}
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Receita Milho Total</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {(scenario.data.receitaMilhoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaMilhoTotal || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Etanol Hidratado</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.receitaEtanolHidratadoMilho.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaEtanolHidratadoMilho)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Etanol Anidro</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.receitaEtanolAnidroMilho.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaEtanolAnidroMilho)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">DDG</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.receitaDDG.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaDDG)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">WDG</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.receitaWDG.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaWDG)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CO2</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaCO2.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaCO2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CBIO</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaCBIO.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaCBIO)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Outras Receitas</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaOther.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaOther)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Derivativos/Câmbio</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.derivativosCambio.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.derivativosCambio)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Impostos</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.impostos)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Impostos Cana</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {(scenario.data.impostosCana || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.impostosCana || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Impostos Milho</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {(scenario.data.impostosMilho || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.impostosMilho || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Receita Líquida</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaLiquida)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Receita Líquida Cana</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {(scenario.data.receitaLiquidaCana || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaLiquidaCana || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Receita Líquida Milho</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {(scenario.data.receitaLiquidaMilho || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaLiquidaMilho || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Receita Líquida Outras</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {(scenario.data.receitaLiquidaOutras || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.receitaLiquidaOutras || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CPV Total</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.cpvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.cpvTotal)}
                    </TableCell>
                  </TableRow>

                  {/* Custo Cana Total */}
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Custo Cana Total</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {scenario.data.custoCanaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoCanaTotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Açúcar VHP</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {(scenario.data.cpvTotalAcucarVHP || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.cpvTotalAcucarVHP || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Etanol Hidratado</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {(scenario.data.cpvTotalEHC || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.cpvTotalEHC || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Etanol Anidro</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {(scenario.data.cpvTotalEAC || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.cpvTotalEAC || 0)}
                    </TableCell>
                  </TableRow>

                  {/* Custos Milho Total */}
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Custos Milho Total</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        R$ {scenario.data.custoMilhoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoMilhoTotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Etanol Hidratado</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {(scenario.data.cpvTotalEHM || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.cpvTotalEHM || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Etanol Anidro</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {(scenario.data.cpvTotalEAM || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.cpvTotalEAM || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">DDG</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {(scenario.data.cpvTotalDDG || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.cpvTotalDDG || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">WDG</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {(scenario.data.cpvTotalWDG || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.cpvTotalWDG || 0)}
                    </TableCell>
                  </TableRow>

                  {/* Margem de Contribuição com estrutura hierárquica */}
                  <TableRow>
                    <TableCell className="font-medium">Margem de Contribuição</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        <span className={scenario.data.margemContribuicao >= 0 ? "text-green-600" : "text-red-600"}>
                          R$ {scenario.data.margemContribuicao.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      <span className={calculateTotalValue(s => s.data.margemContribuicao) >= 0 ? "text-green-600" : "text-red-600"}>
                        R$ {calculateTotal(s => s.data.margemContribuicao)}
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Margem Cana</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        <span className={(scenario.data.margemCana || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                          R$ {(scenario.data.margemCana || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      <span className={calculateTotalValue(s => s.data.margemCana || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                        R$ {calculateTotal(s => s.data.margemCana || 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Margem Milho</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        <span className={(scenario.data.margemMilho || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                          R$ {(scenario.data.margemMilho || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      <span className={calculateTotalValue(s => s.data.margemMilho || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                        R$ {calculateTotal(s => s.data.margemMilho || 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground">↳ Margem Outras</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-muted-foreground">
                        <span className={(scenario.data.margemOutras || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                          R$ {(scenario.data.margemOutras || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30 text-muted-foreground">
                      <span className={calculateTotalValue(s => s.data.margemOutras || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                        R$ {calculateTotal(s => s.data.margemOutras || 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Despesas com Vendas</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.despesasVendas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.despesasVendas)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Administração</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.administracao.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.administracao)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Resultado Operacional</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        <span className={scenario.data.resultadoOperacional >= 0 ? "text-green-600" : "text-red-600"}>
                          R$ {scenario.data.resultadoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      <span className={calculateTotalValue(s => s.data.resultadoOperacional) >= 0 ? "text-green-600" : "text-red-600"}>
                        R$ {calculateTotal(s => s.data.resultadoOperacional)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}