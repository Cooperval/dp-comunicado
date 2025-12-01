import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumericInput } from '@/components/ui/numeric-input';
import { useSimulator } from '@/contexts/SimulatorContext';
import { Badge } from '@/components/ui/badge';
import { calcularCustosTotais } from '@/utils/simulatorCalculations';

const ProductionCosts: React.FC = () => {
  const { data, updateCosts } = useSimulator();

  const handleInputChange = (field: keyof typeof data.productionCosts, value: number) => {
    updateCosts({ [field]: value });
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  };
  const { totalCaneCost, totalCornCost } = calcularCustosTotais(data.productionCosts);
  
  // // Cálculos de custo total
  // const totalCaneCost = data.productionCosts.caneRawMaterial + 
  //                      data.productionCosts.caneCct + 
  //                      data.productionCosts.caneIndustry + 
  //                      data.productionCosts.caneExpenses;

  // const totalCornCost = data.productionCosts.cornRawMaterial + 
  //                      data.productionCosts.cornIndustry + 
  //                      data.productionCosts.cornBiomass;

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Custos de Produção
        </h1>
        <p className="text-muted-foreground">
          Configuração dos custos unitários por tonelada processada
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Custos Cana */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🌾</span> */}
              Custos Cana
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Custos por tonelada de cana processada
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <NumericInput
              label="Matéria-prima"
              unit="R$/ton"
              value={data.productionCosts.caneRawMaterial}
              onChange={(value) => handleInputChange('caneRawMaterial', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="CCT"
              unit="R$/ton"
              value={data.productionCosts.caneCct}
              onChange={(value) => handleInputChange('caneCct', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Indústria"
              unit="R$/ton"
              value={data.productionCosts.caneIndustry}
              onChange={(value) => handleInputChange('caneIndustry', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Dispêndios"
              unit="R$/ton"
              value={data.productionCosts.caneExpenses}
              onChange={(value) => handleInputChange('caneExpenses', value)}
              placeholder="0.00"
            />

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Custo Total Cana:</span>
                <Badge className="bg-primary/10 text-primary font-mono text-base">
                  R$ {formatNumber(totalCaneCost)}/ton
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custos Milho */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🌽</span> */}
              Custos Milho
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Custos por tonelada de milho processado
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <NumericInput
              label="Matéria-prima"
              unit="R$/ton"
              value={data.productionCosts.cornRawMaterial}
              onChange={(value) => handleInputChange('cornRawMaterial', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Indústria"
              unit="R$/ton"
              value={data.productionCosts.cornIndustry}
              onChange={(value) => handleInputChange('cornIndustry', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Biomassa"
              unit="R$/ton"
              value={data.productionCosts.cornBiomass}
              onChange={(value) => handleInputChange('cornBiomass', value)}
              placeholder="0.00"
            />

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Custo Total Milho:</span>
                <Badge className="bg-secondary/10 text-secondary font-mono text-base">
                  R$ {formatNumber(totalCornCost)}/ton
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Administração */}
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            Custos Administrativos
          </CardTitle>
          <CardDescription className="text-success-foreground/80">
            Custos fixos de administração
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-w-md">
            <NumericInput
              label="Administração"
              unit="R$/ton"
              value={data.productionCosts.administration}
              onChange={(value) => handleInputChange('administration', value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Despesas de Comercialização */}
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            Despesas de Comercialização
          </CardTitle>
          <CardDescription className="text-blue-100">
            Custos por volume comercializado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NumericInput
              label="Etanol"
              unit="R$/m³"
              value={data.productionCosts.salesExpenseEthanol}
              onChange={(value) => handleInputChange('salesExpenseEthanol', value)}
              placeholder="5.04"
            />
            <NumericInput
              label="Açúcar"
              unit="R$/ton"
              value={data.productionCosts.salesExpenseSugar}
              onChange={(value) => handleInputChange('salesExpenseSugar', value)}
              placeholder="165.09"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Custos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊</span>
            Resumo de Custos
          </CardTitle>
          <CardDescription>
            Visão geral dos custos de produção
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                R$ {formatNumber(totalCaneCost)}
              </div>
              <div className="text-sm text-muted-foreground">Custo/ton Cana</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-secondary mb-2">
                R$ {formatNumber(totalCornCost)}
              </div>
              <div className="text-sm text-muted-foreground">Custo/ton Milho</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-success mb-2">
                R$ {formatNumber(data.productionCosts.administration)}
              </div>
              <div className="text-sm text-muted-foreground">Administração</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Composição dos Custos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-foreground mb-1">Cana-de-açúcar:</h5>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Matéria-prima: R$ {formatNumber(data.productionCosts.caneRawMaterial)}/ton</li>
                  <li>• CCT: R$ {formatNumber(data.productionCosts.caneCct)}/ton</li>
                  <li>• Indústria: R$ {formatNumber(data.productionCosts.caneIndustry)}/ton</li>
                  <li>• Dispêndios: R$ {formatNumber(data.productionCosts.caneExpenses)}/ton</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-foreground mb-1">Milho:</h5>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Matéria-prima: R$ {formatNumber(data.productionCosts.cornRawMaterial)}/ton</li>
                  <li>• Indústria: R$ {formatNumber(data.productionCosts.cornIndustry)}/ton</li>
                  <li>• Biomassa: R$ {formatNumber(data.productionCosts.cornBiomass)}/ton</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionCosts;