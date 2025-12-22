import React, {useEffect} from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumericInput } from '@/components/ui/numeric-input';
import { useSimulator } from '@/pages/apps/simulador-cenarios/contexts/SimulatorContext';
import { Badge } from '@/components/ui/badge';

const Commercialization: React.FC = () => {
  const { data, updateCommerce } = useSimulator();

  // Compute derived values locally
  const prodEAM = (data.corn?.hydratedEthanol || 0) + (data.corn?.anhydrousEthanol || 0);
  const prodDDG = data.corn?.ddg || 0;
  const prodWDG = data.corn?.wdg || 0;
  const prodVHP = data.sugarCane?.vhpSugar || 0;
  const prodEHC = data.sugarCane?.hydratedEthanol || 0;
  const prodEAC = data.sugarCane?.anhydrousEthanol || 0;
  const prodCO2 = data.otherProductions?.co2Corn || 0;
  const prodCBIO = data.otherProductions?.cbio || 0;
  const prodEH = prodEHC;
  const prodEA = prodEAC;

  useEffect(() => {
    const shouldUpdate =
      data.commercialization.vhpSugar === 0 ||
      data.commercialization.hydratedEthanolCane === 0 ||
      data.commercialization.anhydrousEthanolCane === 0 ||
      data.commercialization.cornEthanol === 0 ||
      data.commercialization.ddg === 0 ||
      data.commercialization.wdg === 0;

    if (shouldUpdate) {
      updateCommerce({
        vhpSugar: prodVHP,
        hydratedEthanolCane: prodEHC,
        anhydrousEthanolCane: prodEAC,
        cornEthanol: prodEAM,
        ddg: prodDDG,
        wdg: prodWDG,
      });
    }
  }, [
    data.commercialization,
    prodVHP, prodEHC, prodEAC, prodEAM, prodDDG, prodWDG,
    updateCommerce,
  ]);





  const handleInputChange = (field: keyof typeof data.commercialization, value: number) => {
    updateCommerce({ [field]: value });
  };

  // Cálculos de Estoque Final (assumindo saldo anterior = 0 para simplificar)
  const stockVhpSugar = prodVHP - data.commercialization.vhpSugar;
  const stockHydratedEthanolCane = prodEHC - data.commercialization.hydratedEthanolCane;
  const stockAnhydrousEthanolCane = prodEAC - data.commercialization.anhydrousEthanolCane;
  const stockCornEthanol = prodEAM - data.commercialization.cornEthanol;
  const stockDdg = prodDDG - data.commercialization.ddg;
  const stockWdg = prodWDG - data.commercialization.wdg;

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Comercialização e Estoques
        </h1>
        <p className="text-muted-foreground">
          Controle de vendas e acompanhamento de estoques finais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Comercialização */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🛒</span> */}
              Comercialização
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Volumes comercializados por produto
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <NumericInput
              label="Açúcar VHP"
              unit="ton"
              value={Number(data.commercialization.vhpSugar.toFixed(2))}
              onChange={(value) => handleInputChange('vhpSugar', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Etanol Hidratado Cana"
              unit="m³"
              value={Number(data.commercialization.hydratedEthanolCane.toFixed(2))}
              onChange={(value) => handleInputChange('hydratedEthanolCane', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Etanol Anidro Cana"
              unit="m³"
              value={Number(data.commercialization.anhydrousEthanolCane.toFixed(2))}
              onChange={(value) => handleInputChange('anhydrousEthanolCane', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Etanol Milho"
              unit="m³"
              value={Number(data.commercialization.cornEthanol.toFixed(2))}
              onChange={(value) => handleInputChange('cornEthanol', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="DDG"
              unit="ton"
              value={Number(data.commercialization.ddg.toFixed(2))}
              onChange={(value) => handleInputChange('ddg', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="WDG"
              unit="ton"
              value={Number(data.commercialization.wdg.toFixed(2))}
              onChange={(value) => handleInputChange('wdg', value)}
              placeholder="0.00"
            />
          </CardContent>
        </Card>

        {/* Estoques Finais */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>📦</span> */}
              Estoques Finais
            </CardTitle>
            <CardDescription className="text-success-foreground/80">
              Cálculo automático: Produção - Comercialização
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Açúcar VHP:</span>
              <Badge
                variant={stockVhpSugar >= 0 ? "secondary" : "destructive"}
                className="font-mono"
              >
                {stockVhpSugar.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ton
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Etanol Hid. Cana:</span>
              <Badge
                variant={stockHydratedEthanolCane >= 0 ? "secondary" : "destructive"}
                className="font-mono"
              >
                {stockHydratedEthanolCane.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Etanol Anid. Cana:</span>
              <Badge
                variant={stockAnhydrousEthanolCane >= 0 ? "secondary" : "destructive"}
                className="font-mono"
              >
                {stockAnhydrousEthanolCane.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Etanol Milho:</span>
              <Badge
                variant={stockCornEthanol >= 0 ? "secondary" : "destructive"}
                className="font-mono"
              >
                {stockCornEthanol.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">DDG:</span>
              <Badge
                variant={stockDdg >= 0 ? "secondary" : "destructive"}
                className="font-mono"
              >
                {stockDdg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ton
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">WDG:</span>
              <Badge
                variant={stockWdg >= 0 ? "secondary" : "destructive"}
                className="font-mono"
              >
                {stockWdg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ton
              </Badge>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Valores negativos indicam venda superior à produção.
                Estoques calculados assumindo saldo anterior zero.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Commercialization;