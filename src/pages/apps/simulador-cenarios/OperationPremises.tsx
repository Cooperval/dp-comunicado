// Importa a biblioteca React
import React from 'react';

// Importa componentes visuais reutilizáveis (provavelmente com estilos customizados)
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

// Importa um input numérico customizado usado em toda a aplicação
import { NumericInput } from '@/components/ui/numeric-input';

// Importa o hook personalizado que fornece acesso ao contexto global do simulador
import { useSimulator } from '@/contexts/SimulatorContext';

// Define o componente funcional chamado OperationPremises
const OperationPremises: React.FC = () => {
  // Extrai os dados atuais e a função de atualização do contexto
  const { data, updateData } = useSimulator();

  // Função utilitária que atualiza um campo específico de data (que vem do contexto)
  const handleInputChange = (field: keyof typeof data, value: number) => {
    // Usa a função updateData para atualizar o campo com o novo valor
    updateData({ [field]: value });
  };


  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Premissas da Operação
        </h1>
        <p className="text-muted-foreground">
          Configure os parâmetros operacionais para cana-de-açúcar e milho
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Operação Cana */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🌾</span> */}
              Operação Cana
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Parâmetros de processamento da cana-de-açúcar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <NumericInput
              label="ATR"
              unit="kg/ton"
              value={data.atr}
              onChange={(value) => handleInputChange('atr', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Extração ART"
              unit="%"
              value={data.extractionArt}
              onChange={(value) => handleInputChange('extractionArt', value)}
              placeholder="0.00"
              max={100}
            />

            <NumericInput
              label="Horas Efetivas no mês"
              unit="h"
              value={data.effectiveHours}
              onChange={(value) => handleInputChange('effectiveHours', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Eficiência de Tempo Geral"
              unit="%"
              value={data.generalTimeEfficiency}
              onChange={(value) => handleInputChange('generalTimeEfficiency', value)}
              placeholder="0.00"
              max={100}
            />

            <NumericInput
              label="Rendimento Total Convertido"
              unit="L/ton"
              value={data.totalConvertedYield}
              onChange={(value) => handleInputChange('totalConvertedYield', value)}
              placeholder="0.00"
            />
          </CardContent>
        </Card>

        {/* Operação Milho */}
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {/* <span>🌽</span> */}
              Operação Milho
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Parâmetros de processamento do milho
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <NumericInput
              label="Rendimento Total Convertido"
              unit="L/ton"
              value={data.cornTotalConvertedYield}
              onChange={(value) => handleInputChange('cornTotalConvertedYield', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Eficiência de Tempo Industrial"
              unit="%"
              value={data.industrialTimeEfficiency}
              onChange={(value) => handleInputChange('industrialTimeEfficiency', value)}
              placeholder="0.00"
              max={100}
            />

            <NumericInput
              label="Milho Processado por Dia"
              unit="ton/dia"
              value={data.cornProcessedPerDay}
              onChange={(value) => handleInputChange('cornProcessedPerDay', value)}
              placeholder="0.00"
            />

            <NumericInput
              label="Rendimento WDG Total"
              unit="kg/ton"
              value={data.totalWdgYield}
              onChange={(value) => handleInputChange('totalWdgYield', value)}
              placeholder="0.00"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OperationPremises;