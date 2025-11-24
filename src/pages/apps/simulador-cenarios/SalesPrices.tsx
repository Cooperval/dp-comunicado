import React,{useMemo} from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumericInput } from '@/components/ui/numeric-input';
import { useSimulator } from '@/contexts/SimulatorContext';
import { Badge } from '@/components/ui/badge';

import { calcularPrecosLiquidos } from '@/utils/simulatorCalculations';

const SalesPrices: React.FC = () => {
  const { data, updatePrices } = useSimulator();

  const handleInputChange = (field: keyof typeof data.salesPrices, value: number) => {
    updatePrices({ [field]: value });
  };



    const {
    vhpSugarNet,
    hydratedEthanolNet,
    anhydrousEthanolNet,
    ddgNet,
    wdgNet,
    co2Net,
    cbioNet
  } = useMemo(() => calcularPrecosLiquidos(data.salesPrices), [data.salesPrices]);



  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Preços de Venda
        </h1>
        <p className="text-muted-foreground">
          Configuração de preços brutos, impostos e cálculo automático dos preços líquidos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Preços Brutos */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>💰</span> */}
              Preços Brutos
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Preços de venda antes dos impostos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <NumericInput
              label="Açúcar VHP"
              unit="R$/ton"
              value={data.salesPrices.vhpSugarGross}
              onChange={(value) => handleInputChange('vhpSugarGross', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Etanol Hidratado"
              unit="R$/m³"
              value={data.salesPrices.hydratedEthanolGross}
              onChange={(value) => handleInputChange('hydratedEthanolGross', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Etanol Anidro"
              unit="R$/m³"
              value={data.salesPrices.anhydrousEthanolGross}
              onChange={(value) => handleInputChange('anhydrousEthanolGross', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="DDG"
              unit="R$/ton"
              value={data.salesPrices.ddgGross}
              onChange={(value) => handleInputChange('ddgGross', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="WDG"
              unit="R$/ton"
              value={data.salesPrices.wdgGross}
              onChange={(value) => handleInputChange('wdgGross', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="CO₂"
              unit="R$/ton"
              value={data.salesPrices.co2Gross}
              onChange={(value) => handleInputChange('co2Gross', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="CBIO"
              unit="R$/un"
              value={data.salesPrices.cbioGross}
              onChange={(value) => handleInputChange('cbioGross', value)}
              placeholder="0.00"
            />
          </CardContent>
        </Card>

        {/* Impostos */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🧾</span> */}
              Impostos
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Configuração de ICMS e PIS/COFINS
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Etanol</h4>
              <NumericInput
                label="ICMS Etanol"
                unit="%"
                value={data.salesPrices.icmsEthanol}
                onChange={(value) => handleInputChange('icmsEthanol', value)}
                placeholder="0.00"
              />

              <NumericInput
                label="PIS/COFINS Etanol"
                unit="R$/m³"
                value={data.salesPrices.pisCofinsEthanol}
                onChange={(value) => handleInputChange('pisCofinsEthanol', value)}
                placeholder="0.00"
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-foreground">DDG/WDG</h4>
              <NumericInput
                label="ICMS DDG/WDG"
                unit="%"
                value={data.salesPrices.icmsDdg}
                onChange={(value) => handleInputChange('icmsDdg', value)}
                placeholder="0.00"
              />

              <NumericInput
                label="PIS/COFINS DDG/WDG"
                unit="%"
                value={data.salesPrices.pisccofinsDdg}
                onChange={(value) => handleInputChange('pisccofinsDdg', value)}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preços Líquidos */}
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            {/* <span>💵</span> */}
            Preços Líquidos
          </CardTitle>
          <CardDescription className="text-success-foreground/80">
            Cálculo automático: Preço Bruto - Impostos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Açúcar VHP:</span>
              <Badge variant="outline" className="font-mono">
                R$ {vhpSugarNet.toFixed(1)}/ton
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Etanol Hidratado:</span>
              <Badge variant="outline" className="font-mono">
                R$ {hydratedEthanolNet.toFixed(1)}/m³
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Etanol Anidro:</span>
              <Badge variant="outline" className="font-mono">
                R$ {anhydrousEthanolNet.toFixed(1)}/m³
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">DDG:</span>
              <Badge variant="outline" className="font-mono">
                R$ {ddgNet.toFixed(1)}/ton
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">WDG:</span>
              <Badge variant="outline" className="font-mono">
                R$ {wdgNet.toFixed(1)}/ton
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">CO₂:</span>
              <Badge variant="outline" className="font-mono">
                R$ {co2Net.toFixed(1)}/ton
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">CBIO:</span>
              <Badge variant="outline" className="font-mono">
                R$ {cbioNet.toFixed(1)}/un
              </Badge>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Fórmula:</strong> Preço Líquido = Preço Bruto - PIS/COFINS - ICMS
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPrices;