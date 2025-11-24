import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumericInput } from '@/components/ui/numeric-input';
import { useSimulator } from '@/contexts/SimulatorContext';
import { Badge } from '@/components/ui/badge';
import { calcularProducoesCana } from '@/utils/simulatorCalculations';


const Productions: React.FC = () => {

  const { updateSugarCane } = useSimulator();
  const { updateData } = useSimulator();
  const { data } = useSimulator();

  const handleInputChange = (field: keyof typeof data.sugarCane, value: number) => {
    updateSugarCane({ [field]: value });
  };


  // Função utilitária que atualiza um campo específico de data (que vem do contexto)
  const handleInputChange2 = (field: keyof typeof data, value: number) => {
    // Usa a função updateData para atualizar o campo com o novo valor
    updateData({ [field]: value });
  };

  const {
    rendimentoTotalConvertido,
    prodVHP,
    prodEHC,
    prodEAC,
    vhpEquivHydrated,
    anhydrousEquivHydrated,
    vhpProportion,
    ehcProportion,
    eacProportion
  } = calcularProducoesCana(data.sugarCane);



  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  };


  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Produções de Cana-de-Açúcar
        </h1>
        <p className="text-muted-foreground">
          Controle da moagem e produção de derivados da cana
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Moagem de Cana */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>⚙️</span> */}
              Moagem
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Dados de processamento e rendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <NumericInput
                label="Cana Moída Total"
                unit="ton"
                value={data.sugarCane.totalGroundCane}
                onChange={(value) => handleInputChange('totalGroundCane', value)}
                placeholder="0.00"
              />

              <NumericInput
                label="Cana Moída Açúcar"
                unit="ton"
                value={data.sugarCane.sugarGroundCane}
                onChange={(value) => handleInputChange('sugarGroundCane', value)}
                placeholder="0.00"
              />

              <NumericInput
                label="Cana Moída Etanol"
                unit="ton"
                value={data.sugarCane.ethanolGroundCane}
                onChange={(value) => handleInputChange('ethanolGroundCane', value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">

              <NumericInput
                label="ATR"
                unit="kg/ton"
                value={data.atr}
                onChange={(value) => handleInputChange2('atr', value)}
                placeholder="0.00"
              />

              <NumericInput
                label="Extração ART"
                unit="%"
                value={data.extractionArt}
                onChange={(value) => handleInputChange2('extractionArt', value)}
                placeholder="0.00"
                max={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumericInput
                label="Horas Efetivas no mês"
                unit="h"
                value={data.effectiveHours}
                onChange={(value) => handleInputChange2('effectiveHours', value)}
                placeholder="0.00"
              />

              <NumericInput
                label="Eficiência de Tempo Geral"
                unit="%"
                value={data.generalTimeEfficiency}
                onChange={(value) => handleInputChange2('generalTimeEfficiency', value)}
                placeholder="0.00"
                max={100}
              />

            </div>
            <div className=" border-t pt-4 space-y-3">
              <h4 className="font-semibold text-foreground">Rendimentos</h4>
              <div className='grid grid-cols-3 gap-3'>

                <NumericInput
                  label="VHP"
                  unit="kg/t"
                  value={data.sugarCane.sugarPerTonCane}
                  onChange={(value) => handleInputChange('sugarPerTonCane', value)}
                  placeholder="0.00"
                />

                <NumericInput
                  label="Etanol Hidratado."
                  unit="L/t"
                  value={data.sugarCane.hydratedEthanolPerTonCane}
                  onChange={(value) => handleInputChange('hydratedEthanolPerTonCane', value)}
                  placeholder="0.00"
                />

                <NumericInput
                  label="Etanol Anidro"
                  unit="L/t"
                  value={data.sugarCane.anhydrousEthanolPerTonCane}
                  onChange={(value) => handleInputChange('anhydrousEthanolPerTonCane', value)}
                  placeholder="0.00"
                />
              </div>


            </div>


          </CardContent>



        </Card>

        {/* Produção da Cana */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>📊</span> */}
              Produção
            </CardTitle>
            <CardDescription className="text-success-foreground/80">
              Volumes de produção e equivalências
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-foreground">Produções</h4>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Açúcar VHP:</span>
                <Badge variant="outline">{formatNumber(prodVHP)} ton</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Etanol Hidratado:</span>
                <Badge variant="outline">{formatNumber(prodEHC)} m³</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Etanol Anidro:</span>
                <Badge variant="outline">{formatNumber(prodEAC)} m³</Badge>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-foreground">Cálculos Automáticos</h4>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Açúcar VHP (equiv. hidratado):</span>
                <Badge variant="outline">{formatNumber(vhpEquivHydrated)} m³</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Etanol Anidro (equiv. hidratado):</span>
                <Badge variant="outline">{formatNumber(anhydrousEquivHydrated)} m³</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rendimento Total Hidratado:</span>
                <Badge variant="outline">{formatNumber(rendimentoTotalConvertido)} l/ton</Badge>
              </div>

              <div className="mt-4 space-y-2">
                <h5 className="font-medium text-sm text-foreground">Proporções:</h5>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">VHP:</span>
                  <Badge className="bg-primary/10 text-primary">{vhpProportion.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">EHC:</span>
                  <Badge className="bg-success/10 text-success">{ehcProportion.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">EAC:</span>
                  <Badge className="bg-accent/10 text-accent">{eacProportion.toFixed(1)}%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Productions;