import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSimulator } from '@/contexts/SimulatorContext';
import { Download, Save, Trash2, Plus, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function Consolidated() {
  const { savedScenarios, saveScenario, deleteScenario, updateAllScenarios, refreshScenario } = useSimulator();
  const [scenarioName, setScenarioName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const exportToExcel = () => {
    if (savedScenarios.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há cenários salvos para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Criar dados para exportação incluindo a coluna de total
    const exportData = [
      ['Indicador', ...savedScenarios.map(s => s.name), 'Total'],
      ['Data', ...savedScenarios.map(s => s.date), ''],
      ['', ...Array(savedScenarios.length + 1).fill('')], // Linha em branco
      ['PRODUÇÕES', ...Array(savedScenarios.length + 1).fill('')],
      ['Açúcar VHP (ton)', ...savedScenarios.map(s => s.data.sugarProduction.toLocaleString('pt-BR')), calculateTotal(s => s.data.sugarProduction)],
      ['Etanol Hidratado Cana (m³)', ...savedScenarios.map(s => s.data.hydratedEthanolCane.toLocaleString('pt-BR')), calculateTotal(s => s.data.hydratedEthanolCane)],
      ['Etanol Hidratado Milho (m³)', ...savedScenarios.map(s => s.data.hydratedEthanolCorn.toLocaleString('pt-BR')), calculateTotal(s => s.data.hydratedEthanolCorn)],
      ['Etanol Anidro Cana (m³)', ...savedScenarios.map(s => s.data.anhydrousEthanolCane.toLocaleString('pt-BR')), calculateTotal(s => s.data.anhydrousEthanolCane)],
      ['Etanol Anidro Milho (m³)', ...savedScenarios.map(s => s.data.anhydrousEthanolCorn.toLocaleString('pt-BR')), calculateTotal(s => s.data.anhydrousEthanolCorn)],
      ['DDG (ton)', ...savedScenarios.map(s => s.data.ddgProduction.toLocaleString('pt-BR')), calculateTotal(s => s.data.ddgProduction)],
      ['WDG (ton)', ...savedScenarios.map(s => s.data.wdgProduction.toLocaleString('pt-BR')), calculateTotal(s => s.data.wdgProduction)],
      ['', ...Array(savedScenarios.length + 1).fill('')], // Linha em branco
      ['PREÇOS LÍQUIDOS', ...Array(savedScenarios.length + 1).fill('')],
      ['Açúcar VHP (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoVHP.toLocaleString('pt-BR'))],
      ['Etanol Hidratado Cana (R$/m³)', ...savedScenarios.map(s => s.data.precoLiquidoEtanolHidratadoCana.toLocaleString('pt-BR'))],
      ['Etanol Hidratado Milho (R$/m³)', ...savedScenarios.map(s => s.data.precoLiquidoEtanolHidratadoMilho.toLocaleString('pt-BR'))],
      ['Etanol Anidro Cana (R$/m³)', ...savedScenarios.map(s => s.data.precoLiquidoEtanolAnidroCana.toLocaleString('pt-BR'))],
      ['Etanol Anidro Milho (R$/m³)', ...savedScenarios.map(s => s.data.precoLiquidoEtanolAnidroMilho.toLocaleString('pt-BR'))],
      ['DDG (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoDDG.toLocaleString('pt-BR'))],
      ['WDG (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoWDG.toLocaleString('pt-BR'))],
      ['CO2 (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoCO2.toLocaleString('pt-BR'))],
      ['CBIO (R$/ton)', ...savedScenarios.map(s => s.data.precoLiquidoCBIO.toLocaleString('pt-BR'))],
      ['', ...Array(savedScenarios.length + 1).fill('')], // Linha em branco
      ['RESULTADOS FINANCEIROS', ...Array(savedScenarios.length + 1).fill('')],
      ['Receita Total (R$)', ...savedScenarios.map(s => s.data.totalRevenue.toLocaleString('pt-BR')), calculateTotal(s => s.data.totalRevenue)],
      ['Receita Açúcar VHP (R$)', ...savedScenarios.map(s => s.data.receitaAcucarVHP.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaAcucarVHP)],
      ['Receita Etanol Hidratado Cana (R$)', ...savedScenarios.map(s => s.data.receitaEtanolHidratadoCana.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaEtanolHidratadoCana)],
      ['Receita Etanol Anidro Cana (R$)', ...savedScenarios.map(s => s.data.receitaEtanolAnidroCana.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaEtanolAnidroCana)],
      ['Receita Hidratado Milho (R$)', ...savedScenarios.map(s => s.data.receitaEtanolHidratadoMilho.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaEtanolHidratadoMilho)],
      ['Receita Anidro Milho (R$)', ...savedScenarios.map(s => s.data.receitaEtanolAnidroMilho.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaEtanolAnidroMilho)],
      ['Receita DDG (R$)', ...savedScenarios.map(s => s.data.receitaDDG.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaDDG)],
      ['Receita WDG (R$)', ...savedScenarios.map(s => s.data.receitaWDG.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaWDG)],
      ['CO2 (R$)', ...savedScenarios.map(s => s.data.receitaCO2.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaCO2)],
      ['CBIO (R$)', ...savedScenarios.map(s => s.data.receitaCBIO.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaCBIO)],
      ['Derivativos/Câmbio (R$)', ...savedScenarios.map(s => s.data.derivativosCambio.toLocaleString('pt-BR')), calculateTotal(s => s.data.derivativosCambio)],
      ['Impostos (R$)', ...savedScenarios.map(s => s.data.impostos.toLocaleString('pt-BR')), calculateTotal(s => s.data.impostos)],
      ['Receita Líquida (R$)', ...savedScenarios.map(s => s.data.receitaLiquida.toLocaleString('pt-BR')), calculateTotal(s => s.data.receitaLiquida)],
      ['CPV Total (R$)', ...savedScenarios.map(s => s.data.cpvTotal.toLocaleString('pt-BR')), calculateTotal(s => s.data.cpvTotal)],
      ['  Custo Cana Total (R$)', ...savedScenarios.map(s => s.data.custoCanaTotal.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoCanaTotal)],
      ['    Matéria-prima (R$)', ...savedScenarios.map(s => s.data.custoCanaMateriaPrima.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoCanaMateriaPrima)],
      ['    CCT (R$)', ...savedScenarios.map(s => s.data.custoCanaCCT.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoCanaCCT)],
      ['    Indústria (R$)', ...savedScenarios.map(s => s.data.custoCanaIndustria.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoCanaIndustria)],
      ['    Dispêndios (R$)', ...savedScenarios.map(s => s.data.custoCanaDispendios.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoCanaDispendios)],
      ['  Custos Milho Total (R$)', ...savedScenarios.map(s => s.data.custoMilhoTotal.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoMilhoTotal)],
      ['    Matéria-prima (R$)', ...savedScenarios.map(s => s.data.custoMilhoMateriaPrima.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoMilhoMateriaPrima)],
      ['    Indústria (R$)', ...savedScenarios.map(s => s.data.custoMilhoIndustria.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoMilhoIndustria)],
      ['    Biomassa (R$)', ...savedScenarios.map(s => s.data.custoMilhoBiomassa.toLocaleString('pt-BR')), calculateTotal(s => s.data.custoMilhoBiomassa)],
      ['Margem de Contribuição (R$)', ...savedScenarios.map(s => s.data.margemContribuicao.toLocaleString('pt-BR')), calculateTotal(s => s.data.margemContribuicao)],
      ['Despesas com Vendas (R$)', ...savedScenarios.map(s => s.data.despesasVendas.toLocaleString('pt-BR')), calculateTotal(s => s.data.despesasVendas)],
      ['Administração (R$)', ...savedScenarios.map(s => s.data.administracao.toLocaleString('pt-BR')), calculateTotal(s => s.data.administracao)],
      ['Resultado Operacional (R$)', ...savedScenarios.map(s => s.data.resultadoOperacional.toLocaleString('pt-BR')), calculateTotal(s => s.data.resultadoOperacional)],
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Consolidado de Cenários</h1>
          <p className="text-muted-foreground">
            Compare diferentes cenários de simulação lado a lado
          </p>
        </div>

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

                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold" colSpan={savedScenarios.length + 2}>
                      RESULTADOS FINANCEIROS
                    </TableCell>
                  </TableRow>
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
                  <TableRow>
                    <TableCell className="font-medium">Receita Açúcar VHP</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaAcucarVHP.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaAcucarVHP)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Receita Etanol Hidratado Cana</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaEtanolHidratadoCana.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaEtanolHidratadoCana)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Receita Etanol Anidro Cana</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaEtanolAnidroCana.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaEtanolAnidroCana)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Receita Hidratado Milho</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaEtanolHidratadoMilho.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaEtanolHidratadoMilho)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Receita Anidro Milho</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaEtanolAnidroMilho.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaEtanolAnidroMilho)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Receita DDG</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaDDG.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      R$ {calculateTotal(s => s.data.receitaDDG)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Receita WDG</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        R$ {scenario.data.receitaWDG.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold bg-muted/30">
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
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Matéria-prima</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.custoCanaMateriaPrima.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoCanaMateriaPrima)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">CCT</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.custoCanaCCT.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoCanaCCT)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Indústria</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.custoCanaIndustria.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoCanaIndustria)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Dispêndios</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.custoCanaDispendios.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoCanaDispendios)}
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
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Matéria-prima</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.custoMilhoMateriaPrima.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoMilhoMateriaPrima)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Indústria</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.custoMilhoIndustria.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoMilhoIndustria)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-10 text-xs text-muted-foreground">Biomassa</TableCell>
                    {savedScenarios.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center text-xs text-muted-foreground">
                        R$ {scenario.data.custoMilhoBiomassa.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs bg-muted/30 text-muted-foreground">
                      R$ {calculateTotal(s => s.data.custoMilhoBiomassa)}
                    </TableCell>
                  </TableRow>

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