import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SimulatorData, initialSimulatorData } from '@/pages/apps/simulador-cenarios/types/simulator';
import { calcularPrecosLiquidos, calcularDRE, calcularDREPorProduto, calcularCpvPorProduto } from '@/pages/apps/simulador-cenarios/utils/simulatorCalculations';

interface SavedScenario {
  id: string;
  name: string;
  date: string;
  originalData: SimulatorData; // Dados originais completos para edição
  data: {
    // Premissas Cana
    premissaCanaMoidaTotal: number;
    premissaCanaMixAcucar: number;
    premissaCanaMixEtanol: number;
    premissaCanaATR: number;
    premissaCanaRendimentoVHP: number;
    premissaCanaRendimentoEHC: number;
    premissaCanaRendimentoEAC: number;
    // Premissas Milho
    premissaMilhoRendimentoConvertido: number;
    premissaMilhoRendimentoDDG: number;
    premissaMilhoRendimentoWDG: number;
    // Produções
    sugarProduction: number;
    hydratedEthanolCane: number;
    hydratedEthanolCorn: number;
    anhydrousEthanolCane: number;
    anhydrousEthanolCorn: number;
    ddgProduction: number;
    wdgProduction: number;
    co2Production: number;
    cbioProduction: number;

    // Preços Líquidos
    precoLiquidoVHP: number;
    precoLiquidoEtanolHidratadoCana: number;
    precoLiquidoEtanolHidratadoMilho: number;
    precoLiquidoEtanolAnidroCana: number;
    precoLiquidoEtanolAnidroMilho: number;
    precoLiquidoDDG: number;
    precoLiquidoWDG: number;
    precoLiquidoCO2: number;
    precoLiquidoCBIO: number;

    // Custos de Produção Unitários (R$/ton)
    custoCanaUnitarioMateriaPrima: number;
    custoCanaUnitarioCCT: number;
    custoCanaUnitarioIndustria: number;
    custoCanaUnitarioDispendios: number;
    custoCanaUnitarioTotal: number;
    custoMilhoUnitarioMateriaPrima: number;
    custoMilhoUnitarioIndustria: number;
    custoMilhoUnitarioBiomassa: number;
    custoMilhoUnitarioTotal: number;

    // Custos de Produtos Vendidos (CPV por unidade)
    cpvAcucarVHP: number;          // R$/ton açúcar
    cpvEHC: number;                 // R$/m³ - Hidratado Cana
    cpvEAC: number;                 // R$/m³ - Anidro Cana
    cpvEHM: number;                 // R$/m³ - Hidratado Milho
    cpvEAM: number;                 // R$/m³ - Anidro Milho
    cpvDDG: number;                 // R$/ton DDG
    cpvWDG: number;                 // R$/ton WDG

    // Resultados Financeiros
    totalRevenue: number;
    receitaAcucarVHP: number;
    receitaEtanolHidratadoCana: number;
    receitaEtanolAnidroCana: number;
    receitaEtanolHidratadoMilho: number;
    receitaEtanolAnidroMilho: number;
    receitaDDG: number;
    receitaWDG: number;
    receitaCO2: number;
    receitaCBIO: number;
    receitaOther: number;
    derivativosCambio: number;
    impostos: number;
    receitaLiquida: number;
    cpvTotal: number;

    // CPV Total por Produto (R$)
    custoCanaTotal: number;
    cpvTotalAcucarVHP: number;
    cpvTotalEHC: number;
    cpvTotalEAC: number;

    custoMilhoTotal: number;
    cpvTotalEHM: number;
    cpvTotalEAM: number;
    cpvTotalDDG: number;
    cpvTotalWDG: number;

    // Receitas por Matéria-Prima
    receitaCanaTotal: number;
    receitaMilhoTotal: number;

    // Impostos por Matéria-Prima
    impostosCana: number;
    impostosMilho: number;

    // Receita Líquida por fonte
    receitaLiquidaCana: number;
    receitaLiquidaMilho: number;
    receitaLiquidaOutras: number;

    margemContribuicao: number;
    // Margens por Matéria-Prima
    margemCana: number;
    margemMilho: number;
    margemOutras: number;

    despesasVendas: number;
    resultadoOperacional: number;
    administracao: number;
    ebitda: number;
  };
}

interface SimulatorContextType {
  data: SimulatorData;
  savedScenarios: SavedScenario[];

  derivedSalesPrices: ReturnType<typeof calcularPrecosLiquidos> | undefined;
  updateData: (updates: Partial<SimulatorData>) => void;
  updateSugarCane: (updates: Partial<SimulatorData['sugarCane']>) => void;
  updateCorn: (updates: Partial<SimulatorData['corn']>) => void;
  updateCommerce: (updates: Partial<SimulatorData['commercialization']>) => void;
  updatePrices: (updates: Partial<SimulatorData['salesPrices']>) => void;
  updateCosts: (updates: Partial<SimulatorData['productionCosts']>) => void;
  updateDRE: (updates: Partial<SimulatorData['dre']>) => void;
  calculateDerivedValues: () => void;
  saveScenario: (name: string) => { success: boolean; error?: string };
  deleteScenario: (id: string) => void;
  updateAllScenarios: () => void;
  refreshScenario: (id: string) => void;
  loadScenarioForEditing: (id: string) => boolean;
  importScenario: (scenarioData: SavedScenario) => { success: boolean; error?: string };
  importMultipleScenarios: (scenariosData: SavedScenario[]) => { success: boolean; count: number; error?: string };
}

export type { SavedScenario };

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};

interface SimulatorProviderProps {
  children: ReactNode;
}

export const SimulatorProvider: React.FC<SimulatorProviderProps> = ({ children }) => {
  const [data, setData] = useState<SimulatorData>(initialSimulatorData);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  const updateData = (updates: Partial<SimulatorData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const updateSugarCane = (updates: Partial<SimulatorData['sugarCane']>) => {
    setData(prev => {
      const newSugarCane = { ...prev.sugarCane, ...updates };

      // Recalcular valores derivados quando mix ou total mudar
      if ('sugarMix' in updates || 'ethanolMix' in updates || 'totalGroundCane' in updates) {
        newSugarCane.sugarGroundCane = newSugarCane.totalGroundCane * newSugarCane.sugarMix / 100;
        newSugarCane.ethanolGroundCane = newSugarCane.totalGroundCane * newSugarCane.ethanolMix / 100;
      }

      return { ...prev, sugarCane: newSugarCane };
    });
  };

  const updateCorn = (updates: Partial<SimulatorData['corn']>) => {
    setData(prev => ({
      ...prev,
      corn: { ...prev.corn, ...updates }
    }));
  };

  const updateCommerce = (updates: Partial<SimulatorData['commercialization']>) => {
    setData(prev => ({
      ...prev,
      commercialization: { ...prev.commercialization, ...updates }
    }));
  };

  const updatePrices = (updates: Partial<SimulatorData['salesPrices']>) => {
    setData(prev => ({
      ...prev,
      salesPrices: { ...prev.salesPrices, ...updates }
    }));
  };

  const updateCosts = (updates: Partial<SimulatorData['productionCosts']>) => {
    setData(prev => ({
      ...prev,
      productionCosts: { ...prev.productionCosts, ...updates }
    }));
  };

  const updateDRE = (updates: Partial<SimulatorData['dre']>) => {
    setData(prev => ({
      ...prev,
      dre: { ...prev.dre, ...updates }
    }));
  };

  const calculateDerivedValues = () => {
    setData(prev => {
      const newData = { ...prev };



      const prodEHC = (data.sugarCane.totalGroundCane * data.sugarCane.hydratedEthanolPerTonCane) / 1000;
      const prodEAC = (data.sugarCane.totalGroundCane * data.sugarCane.anhydrousEthanolPerTonCane) / 1000;

      // Produções Milho
      const prodEAM = (data.corn.groundCorn * data.cornTotalConvertedYield * 0.9556) / 1000;


      // Cálculos para CO2
      const totalEthanolCane = prodEAC + prodEHC;
      const totalEthanolCorn = prodEAM;

      newData.otherProductions.co2Cane = totalEthanolCane * 0.736 * 0.76 * 0.342;
      newData.otherProductions.co2Corn = totalEthanolCorn * 0.736 * 0.76 * 0.342;

      // Cálculo CBIO
      const totalEthanol = totalEthanolCane + totalEthanolCorn;
      const cbioCane = (totalEthanolCane * 0.52 / 920) * 1000;
      const cbioCorn = (totalEthanolCorn * 0.52 / 920) * 1000;

      newData.otherProductions.cbio = cbioCane + cbioCorn;

      return newData;
    });
  };


  const saveScenario = (name: string) => {
    try {
      // Usar as funções de cálculo atualizadas
      const dreCalculations = calcularDRE(data);
      const cpvCalculado = calcularCpvPorProduto(data);

      const newScenario: SavedScenario = {
        id: Date.now().toString(),
        name,
        date: new Date().toLocaleDateString('pt-BR'),
        originalData: JSON.parse(JSON.stringify(data)), // Cópia profunda dos dados originais
        data: {
          // Premissas Cana
          premissaCanaMoidaTotal: data.sugarCane.totalGroundCane || 0,
          premissaCanaMixAcucar: data.sugarCane.sugarMix || 0,
          premissaCanaMixEtanol: data.sugarCane.ethanolMix || 0,
          premissaCanaATR: data.atr || 0,
          premissaCanaRendimentoVHP: data.sugarCane.sugarPerTonCane || 0,
          premissaCanaRendimentoEHC: data.sugarCane.hydratedEthanolPerTonCane || 0,
          premissaCanaRendimentoEAC: data.sugarCane.anhydrousEthanolPerTonCane || 0,
          // Premissas Milho
          premissaMilhoRendimentoConvertido: data.cornTotalConvertedYield || 0,
          premissaMilhoRendimentoDDG: data.ddgYieldPerTon || 0,
          premissaMilhoRendimentoWDG: data.wdgYieldPerTon || 0,
          // Produções
          sugarProduction: dreCalculations.prodVHP || 0,
          hydratedEthanolCane: dreCalculations.prodEHC || 0,
          hydratedEthanolCorn: data.corn.hydratedEthanol || 0,
          anhydrousEthanolCane: dreCalculations.prodEAC || 0,
          anhydrousEthanolCorn: dreCalculations.prodEAM || 0,
          ddgProduction: dreCalculations.prodDDG || 0,
          wdgProduction: dreCalculations.prodWDG || 0,
          co2Production: (data.otherProductions.co2Cane || 0) + (data.otherProductions.co2Corn || 0),
          cbioProduction: data.otherProductions.cbio || 0,

          // Preços Líquidos (usando as funções atualizadas)
          precoLiquidoVHP: data.salesPrices.vhpSugarGross || 0,
          precoLiquidoEtanolHidratadoCana: (data.salesPrices.hydratedEthanolGross || 0) * (1 - (data.salesPrices.icmsEthanol || 0) / 100) - (data.salesPrices.pisCofinsEthanol || 0),
          precoLiquidoEtanolHidratadoMilho: (data.salesPrices.hydratedEthanolGross || 0) * (1 - (data.salesPrices.icmsEthanol || 0) / 100) - (data.salesPrices.pisCofinsEthanol || 0),
          precoLiquidoEtanolAnidroCana: (data.salesPrices.anhydrousEthanolGross || 0) - (data.salesPrices.pisCofinsEthanol || 0),
          precoLiquidoEtanolAnidroMilho: (data.salesPrices.anhydrousEthanolGross || 0) - (data.salesPrices.pisCofinsEthanol || 0),
          precoLiquidoDDG: data.salesPrices.ddgGross || 0,
          precoLiquidoWDG: data.salesPrices.wdgGross || 0,
          precoLiquidoCO2: data.salesPrices.co2Gross || 0,
          precoLiquidoCBIO: data.salesPrices.cbioGross || 0,

          // Custos de Produção Unitários (R$/ton)
          custoCanaUnitarioMateriaPrima: data.productionCosts.caneRawMaterial || 0,
          custoCanaUnitarioCCT: data.productionCosts.caneCct || 0,
          custoCanaUnitarioIndustria: data.productionCosts.caneIndustry || 0,
          custoCanaUnitarioDispendios: data.productionCosts.caneExpenses || 0,
          custoCanaUnitarioTotal: (data.productionCosts.caneRawMaterial || 0) +
            (data.productionCosts.caneCct || 0) +
            (data.productionCosts.caneIndustry || 0) +
            (data.productionCosts.caneExpenses || 0),
          custoMilhoUnitarioMateriaPrima: data.productionCosts.cornRawMaterial || 0,
          custoMilhoUnitarioIndustria: data.productionCosts.cornIndustry || 0,
          custoMilhoUnitarioBiomassa: data.productionCosts.cornBiomass || 0,
          custoMilhoUnitarioTotal: (data.productionCosts.cornRawMaterial || 0) +
            (data.productionCosts.cornIndustry || 0) +
            (data.productionCosts.cornBiomass || 0),

          // Custos de Produtos Vendidos (CPV)
          cpvAcucarVHP: cpvCalculado.vhpSugarCpv || 0,
          cpvEHC: cpvCalculado.hydratedEthanolCaneCpv || 0,
          cpvEAC: cpvCalculado.anhydrousEthanolCaneCpv || 0,
          cpvEHM: cpvCalculado.hydratedEthanolCornCpv || 0,
          cpvEAM: cpvCalculado.anhydrousEthanolCornCpv || 0,
          cpvDDG: cpvCalculado.ddgCpv || 0,
          cpvWDG: cpvCalculado.wdgCpv || 0,

          // Resultados Financeiros (usando os cálculos atualizados)
          totalRevenue: dreCalculations.totalReceitaBruta || 0,
          receitaAcucarVHP: dreCalculations.receitaAcucarCana || 0,
          receitaEtanolHidratadoCana: dreCalculations.receitaEtanolHidratadoCana || 0,
          receitaEtanolAnidroCana: dreCalculations.receitaEtanolAnidrocana || 0,
          receitaEtanolHidratadoMilho: dreCalculations.receitaEtanolHidratadoMilho || 0,
          receitaEtanolAnidroMilho: dreCalculations.receitaEtanolMilho || 0,
          receitaDDG: dreCalculations.receitaDDG || 0,
          receitaWDG: dreCalculations.receitaWDG || 0,
          receitaCO2: (dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0),
          receitaCBIO: dreCalculations.receitaCBIO || 0,
          receitaOther: data.dre.otherRevenues || 0,
          derivativosCambio: dreCalculations.totalDerivativosCambio || 0,
          impostos: dreCalculations.totalImpostos || 0,
          receitaLiquida: dreCalculations.receitaLiquida || 0,
          cpvTotal: dreCalculations.cpvTotal || 0,

          // CPV Total por Produto - Cana (CPV Unitário × Produção)
          cpvTotalAcucarVHP: (cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0),
          cpvTotalEHC: (cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0),
          cpvTotalEAC: (cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0),
          custoCanaTotal: ((cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0)) +
            ((cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0)) +
            ((cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0)),

          // CPV Total por Produto - Milho (CPV Unitário × Produção)
          cpvTotalEHM: (cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0),
          cpvTotalEAM: (cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0),
          cpvTotalDDG: (cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0),
          cpvTotalWDG: (cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0),
          custoMilhoTotal: ((cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0)) +
            ((cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0)) +
            ((cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0)) +
            ((cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0)),

          // Receitas por Matéria-Prima
          receitaCanaTotal: (dreCalculations.receitaAcucarCana || 0) +
            (dreCalculations.receitaEtanolHidratadoCana || 0) +
            (dreCalculations.receitaEtanolAnidrocana || 0),
          receitaMilhoTotal: (dreCalculations.receitaEtanolHidratadoMilho || 0) +
            (dreCalculations.receitaEtanolMilho || 0) +
            (dreCalculations.receitaDDG || 0) +
            (dreCalculations.receitaWDG || 0),

          // Impostos por Matéria-Prima (proporcional às receitas)
          impostosCana: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const prodEHC = (data.sugarCane.totalGroundCane * data.sugarCane.hydratedEthanolPerTonCane) / 1000;
            const prodEAC = (data.sugarCane.totalGroundCane * data.sugarCane.anhydrousEthanolPerTonCane) / 1000;
            return totalReceita > 0 ? (prodEAC * data.salesPrices.pisCofinsEthanol) + (prodEHC * data.salesPrices.pisCofinsEthanol) + (prodEHC * data.salesPrices.hydratedEthanolGross * (data.salesPrices.icmsEthanol / 100)) : 0;
          })(),
          impostosMilho: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const proEAM = (data.corn.groundCorn * data.cornTotalConvertedYield * 0.9556) / 1000
            return totalReceita > 0 ? ((proEAM * data.salesPrices.pisCofinsEthanol)) : 0;
          })(),

          // Receita Líquida por fonte
          receitaLiquidaCana: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const impostosCana = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaCana / totalReceita) : 0;
            return receitaCana - impostosCana;
          })(),
          receitaLiquidaMilho: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const impostosMilho = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaMilho / totalReceita) : 0;
            return receitaMilho - impostosMilho;
          })(),
          receitaLiquidaOutras: ((dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0)) +
            (dreCalculations.receitaCBIO || 0) +
            (data.dre.otherRevenues || 0) +
            (dreCalculations.totalDerivativosCambio || 0),

          // Margens por Matéria-Prima (Receita Líquida - CPV)
          margemCana: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const impostosCana = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaCana / totalReceita) : 0;
            const receitaLiquidaCana = receitaCana - impostosCana;
            const cpvCana = ((cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0)) +
              ((cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0)) +
              ((cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0));
            return receitaLiquidaCana - cpvCana;
          })(),
          margemMilho: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const impostosMilho = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaMilho / totalReceita) : 0;
            const receitaLiquidaMilho = receitaMilho - impostosMilho;
            const cpvMilho = ((cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0)) +
              ((cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0)) +
              ((cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0)) +
              ((cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0));
            return receitaLiquidaMilho - cpvMilho;
          })(),
          margemOutras: ((dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0)) +
            (dreCalculations.receitaCBIO || 0) +
            (data.dre.otherRevenues || 0) +
            (dreCalculations.totalDerivativosCambio || 0), // Outras não tem CPV
          // Margem de Contribuição = Receita Líquida - CPV Total
          margemContribuicao: (dreCalculations.receitaLiquida || 0) - (dreCalculations.cpvTotal || 0),

          despesasVendas: dreCalculations.totalDespesasVendas || 0,
          administracao: dreCalculations.despesasAdm || 0,
          resultadoOperacional: dreCalculations.resultadoOp || 0,
          ebitda: 0, // Deprecated
        }
      };

      setSavedScenarios(prev => [...prev, newScenario]);
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar cenário:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteScenario = (id: string) => {
    setSavedScenarios(prev => prev.filter(scenario => scenario.id !== id));
  };

  const updateAllScenarios = () => {
    try {
      const dreCalculations = calcularDRE(data);
      const cpvCalculado = calcularCpvPorProduto(data);

      setSavedScenarios(prev => prev.map(scenario => ({
        ...scenario,
        originalData: JSON.parse(JSON.stringify(data)), // Atualiza dados originais
        data: {
          // Premissas Cana
          premissaCanaMoidaTotal: data.sugarCane.totalGroundCane || 0,
          premissaCanaMixAcucar: data.sugarCane.sugarMix || 0,
          premissaCanaMixEtanol: data.sugarCane.ethanolMix || 0,
          premissaCanaATR: data.atr || 0,
          premissaCanaRendimentoVHP: data.sugarCane.sugarPerTonCane || 0,
          premissaCanaRendimentoEHC: data.sugarCane.hydratedEthanolPerTonCane || 0,
          premissaCanaRendimentoEAC: data.sugarCane.anhydrousEthanolPerTonCane || 0,
          // Premissas Milho
          premissaMilhoRendimentoConvertido: data.cornTotalConvertedYield || 0,
          premissaMilhoRendimentoDDG: data.ddgYieldPerTon || 0,
          premissaMilhoRendimentoWDG: data.wdgYieldPerTon || 0,
          // Produções
          sugarProduction: dreCalculations.prodVHP || 0,
          hydratedEthanolCane: dreCalculations.prodEHC || 0,
          hydratedEthanolCorn: data.corn.hydratedEthanol || 0,
          anhydrousEthanolCane: dreCalculations.prodEAC || 0,
          anhydrousEthanolCorn: dreCalculations.prodEAM || 0,
          ddgProduction: dreCalculations.prodDDG || 0,
          wdgProduction: dreCalculations.prodWDG || 0,
          co2Production: (data.otherProductions.co2Cane || 0) + (data.otherProductions.co2Corn || 0),
          cbioProduction: data.otherProductions.cbio || 0,

          // Preços Líquidos
          precoLiquidoVHP: data.salesPrices.vhpSugarGross || 0,
          precoLiquidoEtanolHidratadoCana: (data.salesPrices.hydratedEthanolGross || 0) * (1 - (data.salesPrices.icmsEthanol || 0) / 100) - (data.salesPrices.pisCofinsEthanol || 0),
          precoLiquidoEtanolHidratadoMilho: (data.salesPrices.hydratedEthanolGross || 0) * (1 - (data.salesPrices.icmsEthanol || 0) / 100) - (data.salesPrices.pisCofinsEthanol || 0),
          precoLiquidoEtanolAnidroCana: (data.salesPrices.anhydrousEthanolGross || 0) - (data.salesPrices.pisCofinsEthanol || 0),
          precoLiquidoEtanolAnidroMilho: (data.salesPrices.anhydrousEthanolGross || 0) - (data.salesPrices.pisCofinsEthanol || 0),
          precoLiquidoDDG: data.salesPrices.ddgGross || 0,
          precoLiquidoWDG: data.salesPrices.wdgGross || 0,
          precoLiquidoCO2: data.salesPrices.co2Gross || 0,
          precoLiquidoCBIO: data.salesPrices.cbioGross || 0,

          // Custos de Produção Unitários (R$/ton)
          custoCanaUnitarioMateriaPrima: data.productionCosts.caneRawMaterial || 0,
          custoCanaUnitarioCCT: data.productionCosts.caneCct || 0,
          custoCanaUnitarioIndustria: data.productionCosts.caneIndustry || 0,
          custoCanaUnitarioDispendios: data.productionCosts.caneExpenses || 0,
          custoCanaUnitarioTotal: (data.productionCosts.caneRawMaterial || 0) +
            (data.productionCosts.caneCct || 0) +
            (data.productionCosts.caneIndustry || 0) +
            (data.productionCosts.caneExpenses || 0),
          custoMilhoUnitarioMateriaPrima: data.productionCosts.cornRawMaterial || 0,
          custoMilhoUnitarioIndustria: data.productionCosts.cornIndustry || 0,
          custoMilhoUnitarioBiomassa: data.productionCosts.cornBiomass || 0,
          custoMilhoUnitarioTotal: (data.productionCosts.cornRawMaterial || 0) +
            (data.productionCosts.cornIndustry || 0) +
            (data.productionCosts.cornBiomass || 0),

          // Custos de Produtos Vendidos (CPV)
          cpvAcucarVHP: cpvCalculado.vhpSugarCpv || 0,
          cpvEHC: cpvCalculado.hydratedEthanolCaneCpv || 0,
          cpvEAC: cpvCalculado.anhydrousEthanolCaneCpv || 0,
          cpvEHM: cpvCalculado.hydratedEthanolCornCpv || 0,
          cpvEAM: cpvCalculado.anhydrousEthanolCornCpv || 0,
          cpvDDG: cpvCalculado.ddgCpv || 0,
          cpvWDG: cpvCalculado.wdgCpv || 0,

          // Resultados Financeiros
          totalRevenue: dreCalculations.totalReceitaBruta || 0,
          receitaAcucarVHP: dreCalculations.receitaAcucarCana || 0,
          receitaEtanolHidratadoCana: dreCalculations.receitaEtanolHidratadoCana || 0,
          receitaEtanolAnidroCana: dreCalculations.receitaEtanolAnidrocana || 0,
          receitaEtanolHidratadoMilho: dreCalculations.receitaEtanolHidratadoMilho || 0,
          receitaEtanolAnidroMilho: dreCalculations.receitaEtanolMilho || 0,
          receitaDDG: dreCalculations.receitaDDG || 0,
          receitaWDG: dreCalculations.receitaWDG || 0,
          receitaCO2: (dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0),
          receitaCBIO: dreCalculations.receitaCBIO || 0,
          receitaOther: data.dre.otherRevenues || 0,
          derivativosCambio: dreCalculations.totalDerivativosCambio || 0,
          impostos: dreCalculations.totalImpostos || 0,
          receitaLiquida: dreCalculations.receitaLiquida || 0,
          cpvTotal: dreCalculations.cpvTotal || 0,

          // CPV Total por Produto - Cana (CPV Unitário × Produção)
          cpvTotalAcucarVHP: (cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0),
          cpvTotalEHC: (cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0),
          cpvTotalEAC: (cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0),
          custoCanaTotal: ((cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0)) +
            ((cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0)) +
            ((cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0)),

          // CPV Total por Produto - Milho (CPV Unitário × Produção)
          cpvTotalEHM: (cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0),
          cpvTotalEAM: (cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0),
          cpvTotalDDG: (cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0),
          cpvTotalWDG: (cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0),
          custoMilhoTotal: ((cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0)) +
            ((cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0)) +
            ((cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0)) +
            ((cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0)),

          // Receitas por Matéria-Prima
          receitaCanaTotal: (dreCalculations.receitaAcucarCana || 0) +
            (dreCalculations.receitaEtanolHidratadoCana || 0) +
            (dreCalculations.receitaEtanolAnidrocana || 0),
          receitaMilhoTotal: (dreCalculations.receitaEtanolHidratadoMilho || 0) +
            (dreCalculations.receitaEtanolMilho || 0) +
            (dreCalculations.receitaDDG || 0) +
            (dreCalculations.receitaWDG || 0),

          // Impostos por Matéria-Prima (proporcional às receitas)
          impostosCana: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const prodEHC = (data.sugarCane.totalGroundCane * data.sugarCane.hydratedEthanolPerTonCane) / 1000;
            const prodEAC = (data.sugarCane.totalGroundCane * data.sugarCane.anhydrousEthanolPerTonCane) / 1000;
            return totalReceita > 0 ? (prodEAC * data.salesPrices.pisCofinsEthanol) + (prodEHC * data.salesPrices.pisCofinsEthanol) + (prodEHC * data.salesPrices.hydratedEthanolGross * (data.salesPrices.icmsEthanol / 100)) : 0;
          })(),
          impostosMilho: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const proEAM = (data.corn.groundCorn * data.cornTotalConvertedYield * 0.9556) / 1000
            return totalReceita > 0 ? ((proEAM * data.salesPrices.pisCofinsEthanol)) : 0;
          })(),

          // Receita Líquida por fonte
          receitaLiquidaCana: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const impostosCana = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaCana / totalReceita) : 0;
            return receitaCana - impostosCana;
          })(),
          receitaLiquidaMilho: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const impostosMilho = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaMilho / totalReceita) : 0;
            return receitaMilho - impostosMilho;
          })(),
          receitaLiquidaOutras: ((dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0)) +
            (dreCalculations.receitaCBIO || 0) +
            (data.dre.otherRevenues || 0) +
            (dreCalculations.totalDerivativosCambio || 0),

          // Margens por Matéria-Prima (Receita Líquida - CPV)
          margemCana: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const impostosCana = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaCana / totalReceita) : 0;
            const receitaLiquidaCana = receitaCana - impostosCana;
            const cpvCana = ((cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0)) +
              ((cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0)) +
              ((cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0));
            return receitaLiquidaCana - cpvCana;
          })(),
          margemMilho: (() => {
            const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
            const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
            const totalReceita = receitaCana + receitaMilho;
            const impostosMilho = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaMilho / totalReceita) : 0;
            const receitaLiquidaMilho = receitaMilho - impostosMilho;
            const cpvMilho = ((cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0)) +
              ((cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0)) +
              ((cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0)) +
              ((cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0));
            return receitaLiquidaMilho - cpvMilho;
          })(),
          margemOutras: ((dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0)) +
            (dreCalculations.receitaCBIO || 0) +
            (data.dre.otherRevenues || 0) +
            (dreCalculations.totalDerivativosCambio || 0), // Outras não tem CPV
          // Margem de Contribuição = Receita Líquida - CPV Total
          margemContribuicao: (dreCalculations.receitaLiquida || 0) - (dreCalculations.cpvTotal || 0),

          despesasVendas: dreCalculations.totalDespesasVendas || 0,
          administracao: dreCalculations.despesasAdm || 0,
          resultadoOperacional: dreCalculations.resultadoOp || 0,
          ebitda: 0, // Deprecated
        }
      })));
    } catch (error) {
      console.error('Erro ao atualizar cenários:', error);
    }
  };

  const refreshScenario = (id: string) => {
    try {
      const dreCalculations = calcularDRE(data);
      const cpvCalculado = calcularCpvPorProduto(data);

      setSavedScenarios(prev => prev.map(scenario => {
        if (scenario.id === id) {
          return {
            ...scenario,
            originalData: JSON.parse(JSON.stringify(data)), // Atualiza dados originais
            data: {
              // Premissas Cana
              premissaCanaMoidaTotal: data.sugarCane.totalGroundCane || 0,
              premissaCanaMixAcucar: data.sugarCane.sugarMix || 0,
              premissaCanaMixEtanol: data.sugarCane.ethanolMix || 0,
              premissaCanaATR: data.atr || 0,
              premissaCanaRendimentoVHP: data.sugarCane.sugarPerTonCane || 0,
              premissaCanaRendimentoEHC: data.sugarCane.hydratedEthanolPerTonCane || 0,
              premissaCanaRendimentoEAC: data.sugarCane.anhydrousEthanolPerTonCane || 0,
              // Premissas Milho
              premissaMilhoRendimentoConvertido: data.cornTotalConvertedYield || 0,
              premissaMilhoRendimentoDDG: data.ddgYieldPerTon || 0,
              premissaMilhoRendimentoWDG: data.wdgYieldPerTon || 0,
              // Produções
              sugarProduction: dreCalculations.prodVHP || 0,
              hydratedEthanolCane: dreCalculations.prodEHC || 0,
              hydratedEthanolCorn: data.corn.hydratedEthanol || 0,
              anhydrousEthanolCane: dreCalculations.prodEAC || 0,
              anhydrousEthanolCorn: dreCalculations.prodEAM || 0,
              ddgProduction: dreCalculations.prodDDG || 0,
              wdgProduction: dreCalculations.prodWDG || 0,
              co2Production: (data.otherProductions.co2Cane || 0) + (data.otherProductions.co2Corn || 0),
              cbioProduction: data.otherProductions.cbio || 0,

              // Preços Líquidos
              precoLiquidoVHP: data.salesPrices.vhpSugarGross || 0,
              precoLiquidoEtanolHidratadoCana: (data.salesPrices.hydratedEthanolGross || 0) * (1 - (data.salesPrices.icmsEthanol || 0) / 100) - (data.salesPrices.pisCofinsEthanol || 0),
              precoLiquidoEtanolHidratadoMilho: (data.salesPrices.hydratedEthanolGross || 0) * (1 - (data.salesPrices.icmsEthanol || 0) / 100) - (data.salesPrices.pisCofinsEthanol || 0),
              precoLiquidoEtanolAnidroCana: (data.salesPrices.anhydrousEthanolGross || 0) - (data.salesPrices.pisCofinsEthanol || 0),
              precoLiquidoEtanolAnidroMilho: (data.salesPrices.anhydrousEthanolGross || 0) - (data.salesPrices.pisCofinsEthanol || 0),
              precoLiquidoDDG: data.salesPrices.ddgGross || 0,
              precoLiquidoWDG: data.salesPrices.wdgGross || 0,
              precoLiquidoCO2: data.salesPrices.co2Gross || 0,
              precoLiquidoCBIO: data.salesPrices.cbioGross || 0,

              // Custos de Produção Unitários (R$/ton)
              custoCanaUnitarioMateriaPrima: data.productionCosts.caneRawMaterial || 0,
              custoCanaUnitarioCCT: data.productionCosts.caneCct || 0,
              custoCanaUnitarioIndustria: data.productionCosts.caneIndustry || 0,
              custoCanaUnitarioDispendios: data.productionCosts.caneExpenses || 0,
              custoCanaUnitarioTotal: (data.productionCosts.caneRawMaterial || 0) +
                (data.productionCosts.caneCct || 0) +
                (data.productionCosts.caneIndustry || 0) +
                (data.productionCosts.caneExpenses || 0),
              custoMilhoUnitarioMateriaPrima: data.productionCosts.cornRawMaterial || 0,
              custoMilhoUnitarioIndustria: data.productionCosts.cornIndustry || 0,
              custoMilhoUnitarioBiomassa: data.productionCosts.cornBiomass || 0,
              custoMilhoUnitarioTotal: (data.productionCosts.cornRawMaterial || 0) +
                (data.productionCosts.cornIndustry || 0) +
                (data.productionCosts.cornBiomass || 0),

              // Custos de Produtos Vendidos (CPV)
              cpvAcucarVHP: cpvCalculado.vhpSugarCpv || 0,
              cpvEHC: cpvCalculado.hydratedEthanolCaneCpv || 0,
              cpvEAC: cpvCalculado.anhydrousEthanolCaneCpv || 0,
              cpvEHM: cpvCalculado.hydratedEthanolCornCpv || 0,
              cpvEAM: cpvCalculado.anhydrousEthanolCornCpv || 0,
              cpvDDG: cpvCalculado.ddgCpv || 0,
              cpvWDG: cpvCalculado.wdgCpv || 0,

              // Resultados Financeiros
              totalRevenue: dreCalculations.totalReceitaBruta || 0,
              receitaAcucarVHP: dreCalculations.receitaAcucarCana || 0,
              receitaEtanolHidratadoCana: dreCalculations.receitaEtanolHidratadoCana || 0,
              receitaEtanolAnidroCana: dreCalculations.receitaEtanolAnidrocana || 0,
              receitaEtanolHidratadoMilho: dreCalculations.receitaEtanolHidratadoMilho || 0,
              receitaEtanolAnidroMilho: dreCalculations.receitaEtanolMilho || 0,
              receitaDDG: dreCalculations.receitaDDG || 0,
              receitaWDG: dreCalculations.receitaWDG || 0,
              receitaCO2: (dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0),
              receitaCBIO: dreCalculations.receitaCBIO || 0,
              receitaOther: data.dre.otherRevenues || 0,
              derivativosCambio: dreCalculations.totalDerivativosCambio || 0,
              impostos: dreCalculations.totalImpostos || 0,
              receitaLiquida: dreCalculations.receitaLiquida || 0,
              cpvTotal: dreCalculations.cpvTotal || 0,

              // CPV Total por Produto - Cana (CPV Unitário × Produção)
              cpvTotalAcucarVHP: (cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0),
              cpvTotalEHC: (cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0),
              cpvTotalEAC: (cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0),
              custoCanaTotal: ((cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0)) +
                ((cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0)) +
                ((cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0)),

              // CPV Total por Produto - Milho (CPV Unitário × Produção)
              cpvTotalEHM: (cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0),
              cpvTotalEAM: (cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0),
              cpvTotalDDG: (cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0),
              cpvTotalWDG: (cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0),
              custoMilhoTotal: ((cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0)) +
                ((cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0)) +
                ((cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0)) +
                ((cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0)),

              // Receitas por Matéria-Prima
              receitaCanaTotal: (dreCalculations.receitaAcucarCana || 0) +
                (dreCalculations.receitaEtanolHidratadoCana || 0) +
                (dreCalculations.receitaEtanolAnidrocana || 0),
              receitaMilhoTotal: (dreCalculations.receitaEtanolHidratadoMilho || 0) +
                (dreCalculations.receitaEtanolMilho || 0) +
                (dreCalculations.receitaDDG || 0) +
                (dreCalculations.receitaWDG || 0),

              // Impostos por Matéria-Prima (proporcional às receitas)
              impostosCana: (() => {
                const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
                const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
                const totalReceita = receitaCana + receitaMilho;
                const prodEHC = (data.sugarCane.totalGroundCane * data.sugarCane.hydratedEthanolPerTonCane) / 1000;
                const prodEAC = (data.sugarCane.totalGroundCane * data.sugarCane.anhydrousEthanolPerTonCane) / 1000;
                return totalReceita > 0 ? (prodEAC * data.salesPrices.pisCofinsEthanol) + (prodEHC * data.salesPrices.pisCofinsEthanol) + (prodEHC * data.salesPrices.hydratedEthanolGross * (data.salesPrices.icmsEthanol / 100)) : 0;
              })(),
              impostosMilho: (() => {
                const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
                const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
                const totalReceita = receitaCana + receitaMilho;
                const proEAM = (data.corn.groundCorn * data.cornTotalConvertedYield * 0.9556) / 1000
                return totalReceita > 0 ? ((proEAM * data.salesPrices.pisCofinsEthanol)) : 0;
              })(),

              // Receita Líquida por fonte
              receitaLiquidaCana: (() => {
                const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
                const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
                const totalReceita = receitaCana + receitaMilho;
                const impostosCana = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaCana / totalReceita) : 0;
                return receitaCana - impostosCana;
              })(),
              receitaLiquidaMilho: (() => {
                const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
                const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
                const totalReceita = receitaCana + receitaMilho;
                const impostosMilho = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaMilho / totalReceita) : 0;
                return receitaMilho - impostosMilho;
              })(),
              receitaLiquidaOutras: ((dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0)) +
                (dreCalculations.receitaCBIO || 0) +
                (data.dre.otherRevenues || 0) +
                (dreCalculations.totalDerivativosCambio || 0),

              // Margens por Matéria-Prima (Receita Líquida - CPV)
              margemCana: (() => {
                const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
                const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
                const totalReceita = receitaCana + receitaMilho;
                const impostosCana = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaCana / totalReceita) : 0;
                const receitaLiquidaCana = receitaCana - impostosCana;
                const cpvCana = ((cpvCalculado.vhpSugarCpv || 0) * (dreCalculations.prodVHP || 0)) +
                  ((cpvCalculado.hydratedEthanolCaneCpv || 0) * (dreCalculations.prodEHC || 0)) +
                  ((cpvCalculado.anhydrousEthanolCaneCpv || 0) * (dreCalculations.prodEAC || 0));
                return receitaLiquidaCana - cpvCana;
              })(),
              margemMilho: (() => {
                const receitaCana = (dreCalculations.receitaAcucarCana || 0) + (dreCalculations.receitaEtanolHidratadoCana || 0) + (dreCalculations.receitaEtanolAnidrocana || 0);
                const receitaMilho = (dreCalculations.receitaEtanolHidratadoMilho || 0) + (dreCalculations.receitaEtanolMilho || 0) + (dreCalculations.receitaDDG || 0) + (dreCalculations.receitaWDG || 0);
                const totalReceita = receitaCana + receitaMilho;
                const impostosMilho = totalReceita > 0 ? (dreCalculations.totalImpostos || 0) * (receitaMilho / totalReceita) : 0;
                const receitaLiquidaMilho = receitaMilho - impostosMilho;
                const cpvMilho = ((cpvCalculado.hydratedEthanolCornCpv || 0) * (data.corn.hydratedEthanol || 0)) +
                  ((cpvCalculado.anhydrousEthanolCornCpv || 0) * (dreCalculations.prodEAM || 0)) +
                  ((cpvCalculado.ddgCpv || 0) * (dreCalculations.prodDDG || 0)) +
                  ((cpvCalculado.wdgCpv || 0) * (dreCalculations.prodWDG || 0));
                return receitaLiquidaMilho - cpvMilho;
              })(),
              margemOutras: ((dreCalculations.receitaCO2Cana || 0) + (dreCalculations.receitaCO2Milho || 0)) +
                (dreCalculations.receitaCBIO || 0) +
                (data.dre.otherRevenues || 0) +
                (dreCalculations.totalDerivativosCambio || 0), // Outras não tem CPV
              // Margem de Contribuição = Receita Líquida - CPV Total
              margemContribuicao: (dreCalculations.receitaLiquida || 0) - (dreCalculations.cpvTotal || 0),

              despesasVendas: dreCalculations.totalDespesasVendas || 0,
              administracao: dreCalculations.despesasAdm || 0,
              resultadoOperacional: dreCalculations.resultadoOp || 0,
              ebitda: 0, // Deprecated
            }
          };
        }
        return scenario;
      }));
    } catch (error) {
      console.error('Erro ao atualizar cenário:', error);
    }
  };


  const [derivedSalesPrices, setDerivedSalesPrices] = useState<ReturnType<typeof calcularPrecosLiquidos>>();

  useEffect(() => {
    const resultsPrecoVenda = calcularPrecosLiquidos(data.salesPrices);
    setDerivedSalesPrices(resultsPrecoVenda);
  }, [data.salesPrices]);

  // Carrega os dados originais de um cenário para edição
  const loadScenarioForEditing = (id: string): boolean => {
    const scenario = savedScenarios.find(s => s.id === id);
    if (!scenario) {
      console.error('Cenário não encontrado');
      return false;
    }

    // Verifica se tem dados originais
    if (!scenario.originalData) {
      console.error('Este cenário foi salvo em uma versão anterior e não possui dados editáveis. Delete-o e salve novamente.');
      return false;
    }

    // Restaura os dados originais no estado
    setData(JSON.parse(JSON.stringify(scenario.originalData)));
    return true;
  };

  const importScenario = (scenarioData: SavedScenario): { success: boolean; error?: string } => {
    try {
      // Valida se o cenário tem a estrutura correta
      if (!scenarioData.originalData || !scenarioData.data || !scenarioData.name) {
        return { success: false, error: 'Formato de cenário inválido' };
      }

      // Gera novo ID e atualiza a data para evitar conflitos
      const newScenario: SavedScenario = {
        ...scenarioData,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('pt-BR'),
        name: `${scenarioData.name} (importado)`,
      };

      setSavedScenarios(prev => [...prev, newScenario]);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao importar cenário' };
    }
  };

  const importMultipleScenarios = (scenariosData: SavedScenario[]): { success: boolean; count: number; error?: string } => {
    try {
      if (!Array.isArray(scenariosData) || scenariosData.length === 0) {
        return { success: false, count: 0, error: 'Nenhum cenário encontrado no arquivo' };
      }

      const newScenarios: SavedScenario[] = [];

      for (const scenarioData of scenariosData) {
        // Valida se o cenário tem a estrutura correta
        if (!scenarioData.originalData || !scenarioData.data || !scenarioData.name) {
          continue; // Pula cenários inválidos
        }

        // Gera novo ID único e atualiza a data
        newScenarios.push({
          ...scenarioData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date: new Date().toLocaleDateString('pt-BR'),
          name: scenarioData.name,
        });
      }

      if (newScenarios.length === 0) {
        return { success: false, count: 0, error: 'Nenhum cenário válido encontrado' };
      }

      setSavedScenarios(prev => [...prev, ...newScenarios]);
      return { success: true, count: newScenarios.length };
    } catch (error) {
      return { success: false, count: 0, error: 'Erro ao importar cenários' };
    }
  };

  const value: SimulatorContextType = {
    data,
    savedScenarios,
    derivedSalesPrices,
    updateData,
    updateSugarCane,
    updateCorn,
    updateCommerce,
    updatePrices,
    updateCosts,
    updateDRE,
    calculateDerivedValues,
    saveScenario,
    deleteScenario,
    updateAllScenarios,
    refreshScenario,
    loadScenarioForEditing,
    importScenario,
    importMultipleScenarios,
  };

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  );
};