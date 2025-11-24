import React, { useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumericInput } from '@/components/ui/numeric-input';
import { useSimulator } from '@/contexts/SimulatorContext';
import { Badge } from '@/components/ui/badge';
import { calcularProducoesMilho } from '@/utils/simulatorCalculations';
const CornProduction: React.FC = () => {
  const { updateCorn } = useSimulator();
  const { updateData } = useSimulator();
    const { data } = useSimulator();

  // Função utilitária que atualiza um campo específico de data (que vem do contexto)
  const handleInputChange2 = (field: keyof typeof data, value: number) => {
    // Usa a função updateData para atualizar o campo com o novo valor
    updateData({ [field]: value });
  };


  const handleInputChange = (field: keyof typeof data.corn, value: number) => {
    updateCorn({ [field]: value });
  };


  const {
    anhydrousPerTonCorn,
    ddgPerTonCorn,
    wdgPerTonCorn,
    prodEAM,
    prodDDG,
    prodWDG,
    hydratedEquiv,
    anhydrousEquiv,
    totalEthanolEquiv,
    ehmProportion,
    eamProportion,
    totalDdgWdg,
    ddgProportion,
    wdgProportion
  } = calcularProducoesMilho(data.corn, data.cornTotalConvertedYield);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  };


  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-yellow-700 to-yellow-600 bg-clip-text text-transparent">
          Produção de Milho
        </h1>
        <p className="text-muted-foreground">
          Controle da moagem e produção de derivados do milho
        </p>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Moagem */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🌽</span> */}
              Moagem
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Volume processado e rendimentos automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <NumericInput
              label="Milho Moído"
              unit="ton"
              value={data.corn.groundCorn}
              onChange={(value) => handleInputChange('groundCorn', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Rendimento Total Convertido"
              unit="L/ton"
              value={data.cornTotalConvertedYield}
              onChange={(value) => handleInputChange2('cornTotalConvertedYield', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Eficiência de Tempo Industrial"
              unit="%"
              value={data.industrialTimeEfficiency}
              onChange={(value) => handleInputChange2('industrialTimeEfficiency', value)}
              placeholder="0.00"
              max={100}
            />

            <NumericInput
              label="Milho Processado por Dia"
              unit="ton/dia"
              value={data.cornProcessedPerDay}
              onChange={(value) => handleInputChange2('cornProcessedPerDay', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Rendimento WDG Total"
              unit="kg/ton"
              value={data.totalWdgYield}
              onChange={(value) => handleInputChange2('totalWdgYield', value)}
              placeholder="0.00"
            />

            
          </CardContent>
        </Card>

        {/* Produção */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>📊</span> */}
              Produção
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Volumes de produção e equivalências
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Etanol Anidro:</span>
              <Badge variant="outline">{formatNumber(prodEAM)} m³</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">DDG:</span>
              <Badge variant="outline">{formatNumber(prodDDG)} ton</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">WDG:</span>
              <Badge variant="outline">{formatNumber(prodWDG)} ton</Badge>
            </div>


            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-foreground">Rendimentos</h4>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Etanol Anidro / ton milho:</span>
                <Badge variant="outline">{anhydrousPerTonCorn.toFixed(2)} L/ton</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kg DDG / ton milho:</span>
                <Badge variant="outline">{ddgPerTonCorn.toFixed(0)} kg/ton</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kg WDG / ton milho:</span>
                <Badge variant="outline">{wdgPerTonCorn.toFixed(1)} kg/ton</Badge>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-foreground">Equivalências e Proporções</h4>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Etanol Hidratado Equiv.:</span>
                <Badge variant="outline">{formatNumber(hydratedEquiv)} m³</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Etanol Anidro Equiv.:</span>
                <Badge variant="outline">{formatNumber(anhydrousEquiv)} m³</Badge>
              </div>

              <div className="mt-4 space-y-2">
                <h5 className="font-medium text-sm text-foreground">Proporções:</h5>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">EHM:</span>
                  <Badge className="bg-primary/10 text-primary">{ehmProportion.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">EAM:</span>
                  <Badge className="bg-success/10 text-success">{eamProportion.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">DDG:</span>
                  <Badge className="bg-accent/10 text-accent">{ddgProportion.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">WDG:</span>
                  <Badge className="bg-warning/10 text-warning">{wdgProportion.toFixed(1)}%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CornProduction;