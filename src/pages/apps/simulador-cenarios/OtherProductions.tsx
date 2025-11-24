import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulator } from '@/contexts/SimulatorContext';
import { Badge } from '@/components/ui/badge';

import { calcularProducoesCana } from '@/utils/simulatorCalculations';
import { calcularProducoesMilho } from '@/utils/simulatorCalculations';

const OtherProductions: React.FC = () => {
  const { data, calculateDerivedValues } = useSimulator();

  useEffect(() => {
    calculateDerivedValues();
  }, [data.sugarCane, data.corn, calculateDerivedValues]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  };



    const {
      prodEHC,
      prodEAC,
    } = calcularProducoesCana(data.sugarCane);


      const {
        prodEAM,
      } = calcularProducoesMilho(data.corn, data.cornTotalConvertedYield);




  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Outras Produções
        </h1>
        <p className="text-muted-foreground">
          Cálculos automáticos de CO₂ e CBIO baseados na produção de etanol
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* CO2 Cana */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🌱</span> */}
              CO₂ da Cana
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Créditos de carbono da cana-de-açúcar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {formatNumber(data.otherProductions.co2Cane)}
              </div>
              <div className="text-sm text-muted-foreground">toneladas</div>
              <div className="mt-4 text-xs text-muted-foreground">
                Calculado com base na produção de etanol da cana
                <br />
                Fórmula: (EH + EA) × 0,736 × 0,76 × 34,2%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CO2 Milho */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🌽</span> */}
              CO₂ do Milho
            </CardTitle>
            <CardDescription className="text-success-foreground/80">
              Créditos de carbono do milho
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {formatNumber(data.otherProductions.co2Corn)}
              </div>
              <div className="text-sm text-muted-foreground">toneladas</div>
              <div className="mt-4 text-xs text-muted-foreground">
                Calculado com base na produção de etanol do milho
                <br />
                Fórmula: (EH + EA) × 0,736 × 0,76 × 34,2%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CBIO */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>💚</span> */}
              CBIO
            </CardTitle>
            <CardDescription className="text-success-foreground/80">
              Créditos de Descarbonização
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {formatNumber(data.otherProductions.cbio)}
              </div>
              <div className="text-sm text-muted-foreground">unidades</div>
              <div className="mt-4 text-xs text-muted-foreground">
                Calculado com base na produção total de etanol
                <br />
                Fórmula: [(Total Etanol × 0,52) ÷ 920] × 1000
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo dos Cálculos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋</span>
            Resumo dos Cálculos
          </CardTitle>
          <CardDescription>
            Detalhamento dos valores utilizados nas fórmulas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Produção Cana</h4>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Etanol Hidratado:</span>
                <Badge variant="outline">{formatNumber(prodEHC)} m³</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Etanol Anidro:</span>
                <Badge variant="outline">{formatNumber(prodEAC)} m³</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Produção Milho</h4>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Etanol Hidratado:</span>
                <Badge variant="outline">{formatNumber(data.corn.hydratedEthanol)} m³</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Etanol Anidro:</span>
                <Badge variant="outline">{formatNumber(prodEAM)} m³</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Totais</h4>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Etanol Cana:</span>
                <Badge variant="secondary">
                  {formatNumber((prodEAC + prodEHC))} m³
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Etanol Milho:</span>
                <Badge variant="secondary">
                  {formatNumber((prodEAM))} m³
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Créditos</h4>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total CO₂:</span>
                <Badge className="bg-success/10 text-success">
                  {formatNumber((data.otherProductions.co2Cane + data.otherProductions.co2Corn))} ton
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total CBIO:</span>
                <Badge className="bg-success/10 text-success">
                  {formatNumber(data.otherProductions.cbio)} un
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtherProductions;