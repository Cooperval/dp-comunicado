import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulator } from '@/pages/apps/simulador-cenarios/contexts/SimulatorContext';
import { calcularCpvPorProduto } from '@/pages/apps/simulador-cenarios/utils/simulatorCalculations';



const CPV: React.FC = () => {
  const { data } = useSimulator();

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  };



  const {
  vhpSugarCpv,
  hydratedEthanolCaneCpv,
  anhydrousEthanolCaneCpv,
  hydratedEthanolCornCpv,
  anhydrousEthanolCornCpv,
  ddgCpv,
  wdgCpv
} = calcularCpvPorProduto(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Custos dos Produtos Vendidos (CPV)
        </h1>
        <p className="text-muted-foreground">
          Cálculo automático do CPV baseado nos custos de produção e volumes
        </p>
      </div>

      {/* Observações para auxiliar o usuário */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Como é calculado o CPV</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p><strong>Fórmula:</strong> CPV = ((Custo Total × % Proporção) ÷ Rendimento) × 1000</p>
            <p><strong>Onde:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>Custo Total = Matéria Prima + CCT + Indústria + Dispêndios (R$/ton)</li>
              <li>% Proporção = Proporção do produto exibida na tela de Produções (VHP%, EHC%, EAC%)</li>
              <li>Rendimento = Rendimento específico do produto (kg/ton ou L/ton)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Produtos da Cana - tons de verde */}
        <Card className="shadow-card">
          <CardHeader  className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle>Açúcar VHP</CardTitle>

          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-700 mb-2">
              R$ {formatNumber(vhpSugarCpv)}
            </div>
            <div className="text-sm text-muted-foreground">por tonelada</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader  className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle>Etanol Hidratado Cana</CardTitle>

          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-700 mb-2">
              R$ {formatNumber(hydratedEthanolCaneCpv)}
            </div>
            <div className="text-sm text-muted-foreground">por m³</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader  className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle>Etanol Anidro Cana</CardTitle>

          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-700 mb-2">
              R$ {formatNumber(anhydrousEthanolCaneCpv)}
            </div>
            <div className="text-sm text-muted-foreground">por m³</div>
          </CardContent>
        </Card>

        {/* Produtos do Milho - degradê amarelo-verde */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle>Etanol Hidratado Milho</CardTitle>

          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-500 mb-2">
              R$ {formatNumber(hydratedEthanolCornCpv)}
            </div>
            <div className="text-sm text-muted-foreground">por m³</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle>Etanol Anidro Milho</CardTitle>

          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-500 mb-2">
              R$ {formatNumber(anhydrousEthanolCornCpv)}
            </div>
            <div className="text-sm text-muted-foreground">por m³</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle>DDG</CardTitle>

          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-500 mb-2">
              R$ {formatNumber(ddgCpv)}
            </div>
            <div className="text-sm text-muted-foreground">por tonelada</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle>WDG</CardTitle>

          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-500 mb-2">
              R$ {formatNumber(wdgCpv)}
            </div>
            <div className="text-sm text-muted-foreground">por tonelada</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CPV;