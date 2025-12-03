import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SimulatorData, initialSimulatorData } from '@/types/simulator';
import {  calcularPrecosLiquidos, calcularDRE, calcularDREPorProduto } from '@/utils/simulatorCalculations';

interface SavedScenario {
  id: string;
  name: string;
  date: string;
  data: {
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
    
    // Custos Cana detalhados
    custoCanaTotal: number;
    custoCanaMateriaPrima: number;
    custoCanaCCT: number;
    custoCanaIndustria: number;
    custoCanaDispendios: number;
    
    // Custos Milho detalhados
    custoMilhoTotal: number;
    custoMilhoMateriaPrima: number;
    custoMilhoIndustria: number;
    custoMilhoBiomassa: number;
    
    margemContribuicao: number;
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
}

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
    setData(prev => ({
      ...prev,
      sugarCane: { ...prev.sugarCane, ...updates }
    }));
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
      
      const newScenario: SavedScenario = {
        id: Date.now().toString(),
        name,
        date: new Date().toLocaleDateString('pt-BR'),
        data: {
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
          
          // Custos Cana detalhados
          custoCanaTotal: data.sugarCane.totalGroundCane * (data.productionCosts.caneRawMaterial + data.productionCosts.caneCct + data.productionCosts.caneIndustry + data.productionCosts.caneExpenses),
          custoCanaMateriaPrima: data.sugarCane.totalGroundCane * data.productionCosts.caneRawMaterial,
          custoCanaCCT: data.sugarCane.totalGroundCane * data.productionCosts.caneCct,
          custoCanaIndustria: data.sugarCane.totalGroundCane * data.productionCosts.caneIndustry,
          custoCanaDispendios: data.sugarCane.totalGroundCane * data.productionCosts.caneExpenses,
          
          // Custos Milho detalhados
          custoMilhoTotal: data.corn.groundCorn * (data.productionCosts.cornRawMaterial + data.productionCosts.cornIndustry + data.productionCosts.cornBiomass),
          custoMilhoMateriaPrima: data.corn.groundCorn * data.productionCosts.cornRawMaterial,
          custoMilhoIndustria: data.corn.groundCorn * data.productionCosts.cornIndustry,
          custoMilhoBiomassa: data.corn.groundCorn * data.productionCosts.cornBiomass,
          
          margemContribuicao: dreCalculations.lucroBruto || 0,
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
      
      setSavedScenarios(prev => prev.map(scenario => ({
        ...scenario,
        data: {
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
          
          // Custos Cana detalhados
          custoCanaTotal: data.sugarCane.totalGroundCane * (data.productionCosts.caneRawMaterial + data.productionCosts.caneCct + data.productionCosts.caneIndustry + data.productionCosts.caneExpenses),
          custoCanaMateriaPrima: data.sugarCane.totalGroundCane * data.productionCosts.caneRawMaterial,
          custoCanaCCT: data.sugarCane.totalGroundCane * data.productionCosts.caneCct,
          custoCanaIndustria: data.sugarCane.totalGroundCane * data.productionCosts.caneIndustry,
          custoCanaDispendios: data.sugarCane.totalGroundCane * data.productionCosts.caneExpenses,
          
          // Custos Milho detalhados
          custoMilhoTotal: data.corn.groundCorn * (data.productionCosts.cornRawMaterial + data.productionCosts.cornIndustry + data.productionCosts.cornBiomass),
          custoMilhoMateriaPrima: data.corn.groundCorn * data.productionCosts.cornRawMaterial,
          custoMilhoIndustria: data.corn.groundCorn * data.productionCosts.cornIndustry,
          custoMilhoBiomassa: data.corn.groundCorn * data.productionCosts.cornBiomass,
          
          margemContribuicao: dreCalculations.lucroBruto || 0,
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
      
      setSavedScenarios(prev => prev.map(scenario => {
        if (scenario.id === id) {
          return {
            ...scenario,
            data: {
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
              
              // Custos Cana detalhados
              custoCanaTotal: data.sugarCane.totalGroundCane * (data.productionCosts.caneRawMaterial + data.productionCosts.caneCct + data.productionCosts.caneIndustry + data.productionCosts.caneExpenses),
              custoCanaMateriaPrima: data.sugarCane.totalGroundCane * data.productionCosts.caneRawMaterial,
              custoCanaCCT: data.sugarCane.totalGroundCane * data.productionCosts.caneCct,
              custoCanaIndustria: data.sugarCane.totalGroundCane * data.productionCosts.caneIndustry,
              custoCanaDispendios: data.sugarCane.totalGroundCane * data.productionCosts.caneExpenses,
              
              // Custos Milho detalhados
              custoMilhoTotal: data.corn.groundCorn * (data.productionCosts.cornRawMaterial + data.productionCosts.cornIndustry + data.productionCosts.cornBiomass),
              custoMilhoMateriaPrima: data.corn.groundCorn * data.productionCosts.cornRawMaterial,
              custoMilhoIndustria: data.corn.groundCorn * data.productionCosts.cornIndustry,
              custoMilhoBiomassa: data.corn.groundCorn * data.productionCosts.cornBiomass,
              
              margemContribuicao: dreCalculations.lucroBruto || 0,
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
  };

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  );
};