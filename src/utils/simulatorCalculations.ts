// Importa o tipo SugarCaneProduction para garantir que o parâmetro recebido tenha a estrutura esperada
import { SugarCaneProduction } from '@/types/simulator';

// Função que calcula produções e proporções da cana moída
export function calcularProducoesCana(sugarCane: SugarCaneProduction) {
  // Produção de açúcar VHP (toneladas)
  const prodVHP = (sugarCane.totalGroundCane * sugarCane.sugarPerTonCane) / 1000;

  // Produção de etanol hidratado (m³)
  const prodEHC = (sugarCane.totalGroundCane * sugarCane.hydratedEthanolPerTonCane) / 1000;

  // Produção de etanol anidro (m³)
  const prodEAC = (sugarCane.totalGroundCane * sugarCane.anhydrousEthanolPerTonCane) / 1000;

  // Conversão da produção de açúcar para equivalente em etanol hidratado
  const vhpEquivHydrated = prodVHP / 1.39981;

  // Conversão da produção de etanol anidro para equivalente em hidratado
  const anhydrousEquivHydrated = prodEAC / 0.9556;


  // Soma total da produção em equivalente-hidratado
  const totalProduction = vhpEquivHydrated + prodEHC + anhydrousEquivHydrated;

  // Calculo do rendimento total convertido (L/t)
  const rendimentoTotalConvertido = totalProduction / sugarCane.totalGroundCane * 1000;

  // Proporção do açúcar (convertido) no total da produção (%)
  const vhpProportion = totalProduction > 0 ? (vhpEquivHydrated / totalProduction) * 100 : 0;

  // Proporção do etanol hidratado (%)
  const ehcProportion = totalProduction > 0 ? (prodEHC / totalProduction) * 100 : 0;

  // Proporção do etanol anidro (convertido) (%)
  const eacProportion = totalProduction > 0 ? (anhydrousEquivHydrated / totalProduction) * 100 : 0;

  // Retorna todos os valores calculados em um objeto
  return {
    rendimentoTotalConvertido,
    prodVHP,                 // Produção de açúcar VHP (ton)
    prodEHC,                 // Etanol hidratado (m³)
    prodEAC,                 // Etanol anidro (m³)
    vhpEquivHydrated,        // Açúcar convertido em equivalente-hidratado
    anhydrousEquivHydrated,  // Anidro convertido em equivalente-hidratado
    totalProduction,         // Soma total das produções em base comum
    vhpProportion,           // % da produção que vem do açúcar
    ehcProportion,           // % da produção que vem do etanol hidratado
    eacProportion            // % da produção que vem do anidro
  };
}


/*=============================================================================================================================*/

import { CornProduction } from '@/types/simulator';

export function calcularProducoesMilho(
  corn: CornProduction, 
  rendimentoTotalConvertido: number,
  ddgYieldPerTon: number,
  wdgYieldPerTon: number
) {
  // Produções com rendimentos dinâmicos
  const prodEAM = (corn.groundCorn * rendimentoTotalConvertido * 0.9556) / 1000;
  const prodDDG = (corn.groundCorn * ddgYieldPerTon) / 1000;
  const prodWDG = (corn.groundCorn * wdgYieldPerTon) / 1000;

  // Equivalências
  const hydratedEquiv = corn.hydratedEthanol;
  const anhydrousEquiv = prodEAM / 0.9556;
  const totalEthanolEquiv = hydratedEquiv + anhydrousEquiv;

  const ehmProportion = totalEthanolEquiv > 0 ? (hydratedEquiv / totalEthanolEquiv) * 100 : 0;
  const eamProportion = totalEthanolEquiv > 0 ? (anhydrousEquiv / totalEthanolEquiv) * 100 : 0;

  // Proporções DDG/WDG ponderadas por equivalência proteica
  const totalDdgWdg = (prodDDG * 0.88) + (prodWDG * 0.35);
  const ddgProportion = totalDdgWdg > 0 ? ((prodDDG * 0.88) / totalDdgWdg) * 100 : 0;
  const wdgProportion = totalDdgWdg > 0 ? ((prodWDG * 0.35) / totalDdgWdg) * 100 : 0;

  return {
    anhydrousPerTonCorn: rendimentoTotalConvertido * 0.9556,
    ddgPerTonCorn: corn.groundCorn > 0 ? ddgYieldPerTon : 0,
    wdgPerTonCorn: corn.groundCorn > 0 ? wdgYieldPerTon : 0,
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
  };
}

/*=============================================================================================================================*/

import { SalesPrices } from '@/types/simulator';

export function calcularPrecosLiquidos(precos: SalesPrices) {
  const vhpSugarNet = precos.vhpSugarGross; // Assumido sem impostos

  // Etanol hidratado
  const icmsEthanolValue = precos.hydratedEthanolGross * (precos.icmsEthanol / 100);
  const hydratedEthanolNet = precos.hydratedEthanolGross - precos.pisCofinsEthanol - icmsEthanolValue;

  // Etanol anidro
  const anhydrousEthanolNet = precos.anhydrousEthanolGross - precos.pisCofinsEthanol;

  // DDG
  const icmsDdgValue = precos.ddgGross * (precos.icmsDdg / 100);
  const pisCofinsDdgValue = precos.ddgGross * (precos.pisccofinsDdg / 100);
  const ddgNet = precos.ddgGross - pisCofinsDdgValue - icmsDdgValue;

  // WDG
  const icmsWdgValue = precos.wdgGross * (precos.icmsDdg / 100);
  const pisCofinsWdgValue = precos.wdgGross * (precos.pisccofinsDdg / 100);
  const wdgNet = precos.wdgGross - pisCofinsWdgValue - icmsWdgValue;

  // CO2 e CBIO (assumido sem impostos)
  const co2Net = precos.co2Gross;
  const cbioNet = precos.cbioGross;

  return {
    vhpSugarNet,
    hydratedEthanolNet,
    anhydrousEthanolNet,
    ddgNet,
    wdgNet,
    co2Net,
    cbioNet
  };
}


/*=============================================================================================================================*/


import { SimulatorData } from '@/types/simulator';

export function calcularCpvPorProduto(data: SimulatorData) {
  // Custo total de produção
  const totalCaneCost = data.productionCosts.caneRawMaterial +
    data.productionCosts.caneCct +
    data.productionCosts.caneIndustry +
    data.productionCosts.caneExpenses;

  const totalCornCost = data.productionCosts.cornRawMaterial +
    data.productionCosts.cornIndustry +
    data.productionCosts.cornBiomass;

  // Cana - proporções
  const vhpEquivHydrated = data.sugarCane.vhpSugar / 1.46707;
  const anhydrousEquivHydrated = data.sugarCane.anhydrousEthanol / 0.9556;
  const totalCaneProdEthanol = data.sugarCane.hydratedEthanol + anhydrousEquivHydrated;
  const totalCaneProduction = vhpEquivHydrated + totalCaneProdEthanol;

  const vhpProportion = totalCaneProduction > 0 ? (vhpEquivHydrated / totalCaneProduction) : 0;
  const ehcProportion = totalCaneProduction > 0 ? (data.sugarCane.hydratedEthanol / totalCaneProduction) : 0;
  const eacProportion = totalCaneProduction > 0 ? (anhydrousEquivHydrated / totalCaneProduction) : 0;

  const vhpSugarCpv = data.sugarCane.vhpSugar > 0
    ? ((totalCaneCost / data.sugarCane.sugarPerTonCane) * vhpProportion) * 1000 : 0;
  const hydratedEthanolCaneCpv = data.sugarCane.hydratedEthanol > 0
    ? ((totalCaneCost / data.sugarCane.hydratedEthanolPerTonCane) * ehcProportion) * 1000 : 0;
  const anhydrousEthanolCaneCpv = data.sugarCane.anhydrousEthanol > 0
    ? ((totalCaneCost / data.sugarCane.anhydrousEthanolPerTonCane) * eacProportion) * 1000 : 0;

  // Milho - proporções
  const anhydrousPerTonCorn = data.cornTotalConvertedYield * 0.9556;
  const prodEAM = (data.corn.groundCorn * data.cornTotalConvertedYield * 0.9556) / 1000;
  const prodDDG = (data.corn.groundCorn * data.ddgYieldPerTon) / 1000;
  const prodWDG = (data.corn.groundCorn * data.wdgYieldPerTon) / 1000;

  const hydratedEquiv = data.corn.hydratedEthanol;
  const anhydrousEquiv = prodEAM / 0.9556;

  const totalEthanolEquiv = hydratedEquiv + anhydrousEquiv;
  const ehmProportion = totalEthanolEquiv > 0 ? (hydratedEquiv / totalEthanolEquiv) * 100 : 0;
  const eamProportion = totalEthanolEquiv > 0 ? (anhydrousEquiv / totalEthanolEquiv) * 100 : 0;

  const totalDdgWdg = (prodDDG * 0.88) + (prodWDG * 0.35);
  const ddgProportion = totalDdgWdg > 0 ? ((prodDDG * 0.88) / totalDdgWdg) * 100 : 0;
  const wdgProportion = totalDdgWdg > 0 ? ((prodWDG * 0.35) / totalDdgWdg) * 100 : 0;

  const hydratedEthanolCornCpv = data.corn.hydratedEthanol > 0
    ? ((totalCornCost / data.cornTotalConvertedYield) * (ehmProportion / 100)) * 1000 : 0;

  const anhydrousEthanolCornCpv = data.corn.anhydrousEthanol > 0
    ? ((totalCornCost / anhydrousPerTonCorn) * ((eamProportion / 100) - 0.03)) * 1000 : 0;

  const totalWdgYield = (data.ddgYieldPerTon / 0.4) + data.wdgYieldPerTon;
  
  const ddgCpv = data.corn.ddg > 0
    ? (totalCornCost / totalWdgYield) * 0.03 * 1000 * 4 : 0;

  const wdgCpv = data.corn.wdg > 0
    ? (totalCornCost / totalWdgYield) * 0.03 * 1000 : 0;

  return {
    vhpSugarCpv,
    hydratedEthanolCaneCpv,
    anhydrousEthanolCaneCpv,
    hydratedEthanolCornCpv,
    anhydrousEthanolCornCpv,
    ddgCpv,
    wdgCpv,
    vhpProportion,
    ehcProportion,
    eacProportion,
    ehmProportion,
    eamProportion,
    ddgProportion,
    wdgProportion,
  };
}

/*=============================================================================================================================*/

import { ProductionCosts } from '@/types/simulator';

export function calcularCustosTotais(custos: ProductionCosts) {
  const totalCaneCost =
    custos.caneRawMaterial +
    custos.caneCct +
    custos.caneIndustry +
    custos.caneExpenses;

  const totalCornCost =
    custos.cornRawMaterial +
    custos.cornIndustry +
    custos.cornBiomass;

  return {
    totalCaneCost,
    totalCornCost,
  };
}

/*=============================================================================================================================*/

//CALCULA DRE
export function calcularDRE(data: SimulatorData) {
  // Produções - Cana
  const prodVHP = (data.sugarCane.totalGroundCane * data.sugarCane.sugarPerTonCane) / 1000;
  const prodEHC = (data.sugarCane.totalGroundCane * data.sugarCane.hydratedEthanolPerTonCane) / 1000;
  const prodEAC = (data.sugarCane.totalGroundCane * data.sugarCane.anhydrousEthanolPerTonCane) / 1000;

  // Produções - Milho
  const prodEAM = (data.corn.groundCorn * data.cornTotalConvertedYield * 0.9556) / 1000;
  const prodDDG = (data.corn.groundCorn * data.ddgYieldPerTon) / 1000;
  const prodWDG = (data.corn.groundCorn * data.wdgYieldPerTon) / 1000;

  // Receita Operacional Bruta - Cana
  const receitaAcucarCana = prodVHP * data.salesPrices.vhpSugarGross;
  const receitaEtanolHidratadoCana = prodEHC * data.salesPrices.hydratedEthanolGross;
  const receitaEtanolAnidrocana = prodEAC * data.salesPrices.anhydrousEthanolGross;
  const receitaCO2Cana = data.otherProductions.co2Cane * data.salesPrices.co2Gross;

  // Receita CBIO
  const totalEtanolCana = prodEHC + prodEAC + prodEAM;
  const receitaCBIO = ((totalEtanolCana * 0.52) / 920) * 1000 * data.salesPrices.cbioGross;

  // Receita Operacional Bruta - Milho
  const receitaEtanolMilho = prodEAM * data.salesPrices.anhydrousEthanolGross;
  const receitaEtanolHidratadoMilho = data.corn.hydratedEthanol * data.salesPrices.hydratedEthanolGross;
  const receitaDDG = prodDDG * data.salesPrices.ddgGross;
  const receitaWDG = prodWDG * data.salesPrices.wdgGross;
  const receitaCO2Milho = data.otherProductions.co2Corn * data.salesPrices.co2Gross;

  const totalReceitaBruta =
    receitaAcucarCana + receitaEtanolHidratadoCana + receitaEtanolAnidrocana +
    receitaCO2Cana + receitaCBIO + receitaEtanolMilho + receitaEtanolHidratadoMilho +
    receitaDDG + receitaWDG + receitaCO2Milho + data.dre.otherRevenues;

  // Derivativos e Câmbio
  const totalDerivativosCambio = data.dre.derivativesResult + data.dre.exchangeResult;





  // CPV
  const cpvCana = data.sugarCane.totalGroundCane * (
    data.productionCosts.caneRawMaterial +
    data.productionCosts.caneCct +
    data.productionCosts.caneIndustry +
    data.productionCosts.caneExpenses
  );

  const cpvMilho = data.corn.groundCorn * (
    data.productionCosts.cornRawMaterial +
    data.productionCosts.cornIndustry +
    data.productionCosts.cornBiomass
  );

  const cpvTotal = cpvCana + cpvMilho + data.dre.otherCosts;

  // Despesas com Vendas
  const totalEthanol = prodEHC + (prodEAC) +
    data.corn.hydratedEthanol + (prodEAM);

  const despesasComercializacaoEtanol = totalEthanol * data.productionCosts.salesExpenseEthanol;
  const despesasComercializacaoAcucar = prodVHP * data.productionCosts.salesExpenseSugar;
  const totalDespesasVendas = despesasComercializacaoEtanol + despesasComercializacaoAcucar;


  //ICMSTOTAL
  const icmsTotal = receitaEtanolHidratadoCana * (data.salesPrices.icmsEthanol / 100);

  //PIS/COFINS TOTAL
  const pisCofinsTotal = (prodEHC + prodEAC + prodEAM) * data.salesPrices.pisCofinsEthanol;

  // Impostos
  const totalImpostos = icmsTotal + pisCofinsTotal +
    data.dre.ipiTotal + data.dre.inssTotal + data.dre.otherTaxes;

  // Receita Líquida
  const receitaLiquida = totalReceitaBruta + totalDerivativosCambio - totalImpostos;

  // Lucro Bruto
  const lucroBruto = receitaLiquida - cpvTotal;

  // Despesas Administrativas
  const despesasAdm = data.productionCosts.administration * data.sugarCane.totalGroundCane;

  // Resultado Operacional (nova fórmula: Margem - Vendas - Admin)
  const resultadoOp = lucroBruto - totalDespesasVendas - despesasAdm;

  return {
    prodVHP,
    prodEHC,
    prodEAC,
    prodEAM,
    prodDDG,
    prodWDG,
    receitaAcucarCana,
    receitaEtanolHidratadoCana,
    receitaEtanolAnidrocana,
    receitaCO2Cana,
    receitaEtanolMilho,
    receitaEtanolHidratadoMilho,
    receitaDDG,
    receitaWDG,
    receitaCO2Milho,
    receitaCBIO,
    totalReceitaBruta,
    totalDerivativosCambio,
    totalImpostos,
    receitaLiquida,
    cpvCana,
    cpvMilho,
    cpvTotal,
    despesasComercializacaoEtanol,
    totalEthanol,
    despesasComercializacaoAcucar,
    totalDespesasVendas,
    lucroBruto,
    resultadoOp,
    icmsTotal,
    pisCofinsTotal,
    despesasAdm
  };
}

/*=============================================================================================================================*/

//CALCULA DRE POR PRODUTO

export interface DREPorProdutoResultado {
  productMatrixData: Record<string, ProductData>;
  caneProcessed: number;
  cornProcessed: number;
  caneMarginPerTon: number;
  cornMarginPerTon: number;
  totalCornRevenuePerTon: number;
  caneTotalCost: number;
  sugarRevenuePerTon: number;
  hydratedEthanolCaneRevenuePerTon: number;
  anhydrousEthanolCaneRevenuePerTon: number;
  totalCaneRevenuePerTon: number;
  cornTotalCost: number;
  hydratedEthanolCornRevenuePerTon: number;
  anhydrousEthanolCornRevenuePerTon: number;
  ddgRevenuePerTon: number;
  wdgRevenuePerTon: number;
  unitCO2Cana: number;
  unitCBIOCana: number;
  receitaCO2Cana: number;
  receitaCBIOCana: number;
  receitaCO2Milho: number;
  unitCO2Milho: number;
  unitCBIOMilho: number;
  receitaCBIOMilho: number;
  custoAdm: number;
  unitAdm: number;
  despesasVCana: number;
  unitVCana: number;
  unitVMilho: number;
  despesasVEtanolMilho: number;
  resulMilho: number;
  resulCana: number;
  rolEAC: number;
  rolEHC: number;
  receitasCana: {
    sugarRevenue: number;

    hydratedEthanolCaneRevenue: number;
    anhydrousEthanolCaneRevenue: number;
    totalPerTon: number;
  };
  receitasMilho: {
    hydratedEthanolCornRevenue: number;
    anhydrousEthanolCornRevenue: number;
    ddgRevenue: number;
    wdgRevenue: number;
    totalPerTon: number;
  };
}


export interface ProductData {
  receita: number;
  deducoes: number;
  comercializacao: number;
  receitaLiquida: number;
  custoMateriaPrima: number;
  custoCCT: number;
  custoIndustria: number;
  custoBiomassa: number;
  administracao: number;
  margemBruta: number;
  resultadoOp: number;
}

export function calcularDREPorProduto(data: SimulatorData): DREPorProdutoResultado {
  // Produções Cana
  const prodVHP = (data.sugarCane.totalGroundCane * data.sugarCane.sugarPerTonCane) / 1000;
  const prodEHC = (data.sugarCane.totalGroundCane * data.sugarCane.hydratedEthanolPerTonCane) / 1000;
  const prodEAC = (data.sugarCane.totalGroundCane * data.sugarCane.anhydrousEthanolPerTonCane) / 1000;

  // Produções Milho
  const prodEAM = (data.corn.groundCorn * data.cornTotalConvertedYield * 0.9556) / 1000;
  const prodDDG = (data.corn.groundCorn * data.ddgYieldPerTon) / 1000;
  const prodWDG = (data.corn.groundCorn * data.wdgYieldPerTon) / 1000;

  // Equivalências
  const hydratedEquiv = data.corn.hydratedEthanol;
  const anhydrousEquiv = prodEAM / 0.9556;
  const totalEthanolEquiv = hydratedEquiv + anhydrousEquiv;

  const ehmProportion = totalEthanolEquiv > 0 ? (hydratedEquiv / totalEthanolEquiv) : 0;
  const eamProportion = totalEthanolEquiv > 0 ? (anhydrousEquiv / totalEthanolEquiv) : 0;

  const totalDdgWdg = (prodDDG * 0.88) + (prodWDG * 0.35);
  const ddgProportion = totalDdgWdg > 0 ? ((prodDDG * 0.88) / totalDdgWdg) : 0;
  const wdgProportion = totalDdgWdg > 0 ? ((prodWDG * 0.35) / totalDdgWdg) : 0;

  // Cálculos automáticos Cana
  const vhpEquivHydrated = prodVHP / 1.46707;
  const anhydrousEquivHydrated = prodEAC / 0.9556;
  const totalProduction = vhpEquivHydrated + prodEHC + anhydrousEquivHydrated;

  const vhpProportion = totalProduction > 0 ? (vhpEquivHydrated / totalProduction) : 0;
  const ehcProportion = totalProduction > 0 ? (prodEHC / totalProduction) : 0;
  const eacProportion = totalProduction > 0 ? (anhydrousEquivHydrated / totalProduction) : 0;

  const caneProcessed = data.sugarCane.totalGroundCane;
  const cornProcessed = data.corn.groundCorn;

  const p = data.productionCosts;
  const s = data.salesPrices;



  const productMatrixData: Record<string, ProductData> = {
    sugarVHP: {
      receita: (prodVHP * s.vhpSugarGross) / 1000,
      deducoes: 0,
      receitaLiquida: (prodVHP * s.vhpSugarGross)  / 1000,
      custoMateriaPrima: (p.caneRawMaterial * caneProcessed * vhpProportion) / 1000,
      custoCCT: (p.caneCct * caneProcessed * vhpProportion) / 1000,
      custoIndustria: (p.caneIndustry * caneProcessed * vhpProportion) / 1000,
      custoBiomassa: 0,
      comercializacao: (prodVHP * p.salesExpenseSugar) / 1000,
      administracao: (p.administration * caneProcessed * vhpProportion) / 1000,
      margemBruta: 0,
      resultadoOp: 0,
    },
    ethanolHydratedCane: {
      receita: (prodEHC * s.hydratedEthanolGross) / 1000,
      deducoes: ((prodEHC * s.hydratedEthanolGross) * (s.icmsEthanol / 100) + (prodEHC * s.pisCofinsEthanol)) / 1000,
      receitaLiquida: ((prodEHC * s.hydratedEthanolGross) - ((prodEHC * s.hydratedEthanolGross) * (s.icmsEthanol / 100) + (prodEHC * s.pisCofinsEthanol))) / 1000,
      custoMateriaPrima: (p.caneRawMaterial * caneProcessed * ehcProportion) / 1000,
      custoCCT: (p.caneCct * caneProcessed * ehcProportion) / 1000,
      custoIndustria: (p.caneIndustry * caneProcessed * ehcProportion) / 1000,
      custoBiomassa: 0,
      comercializacao: (prodEHC * p.salesExpenseEthanol) / 1000,
      administracao: (p.administration * caneProcessed * ehcProportion) / 1000,
      margemBruta: 0,
      resultadoOp: 0,
    },
    ethanolAnhydrousCane: {
      receita: (prodEAC * s.anhydrousEthanolGross) / 1000,
      deducoes: (prodEAC * s.pisCofinsEthanol) / 1000,
      receitaLiquida: ((prodEAC * s.anhydrousEthanolGross) - (prodEAC * s.pisCofinsEthanol)) / 1000,
      custoMateriaPrima: (p.caneRawMaterial * caneProcessed * eacProportion) / 1000,
      custoCCT: (p.caneCct * caneProcessed * eacProportion) / 1000,
      custoIndustria: (p.caneIndustry * caneProcessed * eacProportion) / 1000,
      custoBiomassa: 0,
      comercializacao: (prodEAC * p.salesExpenseEthanol) / 1000,
      administracao: (p.administration * caneProcessed * eacProportion) / 1000,
      margemBruta: 0,
      resultadoOp: 0,
    },
    ethanolHydratedCorn: {
      receita: 0,
      deducoes: 0,
      receitaLiquida: 0,
      custoMateriaPrima: (p.cornRawMaterial * cornProcessed * ehmProportion * 0.97) / 1000,
      custoCCT: 0,
      custoIndustria: (p.cornIndustry * cornProcessed * ehmProportion * 0.97) / 1000,
      custoBiomassa: (p.cornBiomass * cornProcessed * ehmProportion * 0.97) / 1000,
      comercializacao: 0,
      administracao: 0,
      margemBruta: 0,
      resultadoOp: 0,
    },
    ethanolAnhydrousCorn: {
      receita: (prodEAM * s.anhydrousEthanolGross) / 1000,
      deducoes: (prodEAM * s.pisCofinsEthanol) / 1000,
      receitaLiquida: ((prodEAM * s.anhydrousEthanolGross) - (prodEAM * s.pisCofinsEthanol)) / 1000,
      custoMateriaPrima: (p.cornRawMaterial * cornProcessed * eamProportion * 0.97) / 1000,
      custoCCT: 0,
      custoIndustria: (p.cornIndustry * cornProcessed * eamProportion * 0.97) / 1000,
      custoBiomassa: (p.cornBiomass * cornProcessed * eamProportion * 0.97) / 1000,
      comercializacao: (prodEAM * p.salesExpenseEthanol) / 1000,
      administracao: 0,
      margemBruta: 0,
      resultadoOp: 0,
    },
    ddg: {
      receita: (prodDDG * s.ddgGross) / 1000,
      deducoes: 0,
      receitaLiquida: (prodDDG * s.ddgGross) / 1000,
      custoMateriaPrima: (p.cornRawMaterial * cornProcessed * ddgProportion * 0.03) / 1000,
      custoCCT: 0,
      custoIndustria: (p.cornIndustry * cornProcessed * ddgProportion * 0.03) / 1000,
      custoBiomassa: (p.cornBiomass * cornProcessed * ddgProportion * 0.03) / 1000,
      comercializacao: 0,
      administracao: 0,
      margemBruta: 0,
      resultadoOp: 0,
    },
    wdg: {
      receita: (prodWDG * s.wdgGross) / 1000,
      deducoes: 0,
      receitaLiquida: (prodWDG * s.wdgGross) / 1000,
      custoMateriaPrima: (p.cornRawMaterial * cornProcessed * wdgProportion * 0.03) / 1000,
      custoCCT: 0,
      custoIndustria: (p.cornIndustry * cornProcessed * wdgProportion * 0.03) / 1000,
      custoBiomassa: (p.cornBiomass * cornProcessed * wdgProportion * 0.03) / 1000,
      comercializacao: 0,
      administracao: 0,
      margemBruta: 0,
      resultadoOp: 0,
    },
  };






  const caneTotalCost = p.caneRawMaterial + p.caneCct + p.caneIndustry + p.caneExpenses;


  const sugarRevenue = prodVHP * s.vhpSugarGross;
  const hydratedEthanolCaneRevenue = prodEHC * s.hydratedEthanolGross;
  const anhydrousEthanolCaneRevenue = prodEAC * s.anhydrousEthanolGross;
  //const totalCaneRevenuePerTon = (sugarRevenue + hydratedEthanolCaneRevenue + anhydrousEthanolCaneRevenue) / caneProcessed;


  //ICMSTOTAL
  const icmsTotal = hydratedEthanolCaneRevenue * (data.salesPrices.icmsEthanol / 100);

  //PIS/COFINS TOTAL
  const pisCofinsEHC = prodEHC * data.salesPrices.pisCofinsEthanol;
  const pisCofinsEAC = prodEAC * data.salesPrices.pisCofinsEthanol;
  const pisCofinsEAM = prodEAM * data.salesPrices.pisCofinsEthanol;

  const rolEHC = (hydratedEthanolCaneRevenue - icmsTotal - pisCofinsEHC);
  const rolEAC = (anhydrousEthanolCaneRevenue - pisCofinsEAC);

  
  const caneRevenueTotal = prodVHP * s.vhpSugarGross + rolEHC + rolEAC;

  const sugarRevenuePerTon = sugarRevenue / caneProcessed;

  const hydratedEthanolCaneRevenuePerTon = rolEHC / caneProcessed;
  const anhydrousEthanolCaneRevenuePerTon = rolEAC / caneProcessed;




  const anhydrousEthanolCornRevenue = (prodEAM * s.anhydrousEthanolGross) - pisCofinsEAM;
  const hydratedEthanolCornRevenue = 0; // como no restante do código
  const ddgRevenue = prodDDG * s.ddgGross;
  const wdgRevenue = prodWDG * s.wdgGross;


  const hydratedEthanolCornRevenuePerTon = hydratedEthanolCornRevenue / cornProcessed;
  const anhydrousEthanolCornRevenuePerTon = anhydrousEthanolCornRevenue / cornProcessed;
  const ddgRevenuePerTon = ddgRevenue / cornProcessed;
  const wdgRevenuePerTon = (prodWDG * data.salesPrices.wdgGross) / cornProcessed;

  const cornTotalCost = p.cornRawMaterial + p.cornIndustry + p.cornBiomass;



  // Cálculos para CO2
  const totalEthanolCane = prodEAC + prodEHC;
  const totalEthanolCorn = prodEAM;

  const Co2Cane = totalEthanolCane * 0.736 * 0.76 * 0.342;
  const Co2Corn = totalEthanolCorn * 0.736 * 0.76 * 0.342;

  // Cálculo CBIO

  const cbioCane = (totalEthanolCane * 0.52 / 920) * 1000;
  const cbioCorn = (totalEthanolCorn * 0.52 / 920) * 1000;
  const receitaCBIOCana = cbioCane * data.salesPrices.cbioGross;
  const receitaCBIOMilho = cbioCorn * data.salesPrices.cbioGross;

  const unitCBIOCana = receitaCBIOCana / caneProcessed;
  const unitCBIOMilho = receitaCBIOMilho / cornProcessed;

  const receitaCO2Cana = Co2Cane * data.salesPrices.co2Gross;
  const receitaCO2Milho = Co2Corn * data.salesPrices.co2Gross;

  const unitCO2Cana = receitaCO2Cana / caneProcessed;
  const unitCO2Milho = receitaCO2Milho / cornProcessed;

  const totalCaneRevenuePerTon = sugarRevenuePerTon + hydratedEthanolCaneRevenuePerTon + anhydrousEthanolCaneRevenuePerTon + unitCO2Cana + unitCBIOCana;
  const totalCornRevenuePerTon = (anhydrousEthanolCornRevenue + ddgRevenue + wdgRevenue + receitaCO2Milho + receitaCBIOMilho) / cornProcessed;

  const custoAdm = data.productionCosts.administration * caneProcessed;
  const unitAdm = data.productionCosts.administration;


  // Despesas com Vendas

  const despesasVEtanolCana = totalEthanolCane * p.salesExpenseEthanol;
  const despesasVEtanolMilho = totalEthanolCorn * p.salesExpenseEthanol;

  const despesasVVHP = prodVHP * p.salesExpenseSugar;
  const despesasVCana = despesasVEtanolCana + despesasVVHP;


  const unitVCana = despesasVCana / caneProcessed;
  const unitVMilho = despesasVEtanolMilho / cornProcessed;

  const cornMarginPerTon = totalCornRevenuePerTon - cornTotalCost;
  const caneMarginPerTon = (totalCaneRevenuePerTon) - caneTotalCost;


  const resulCana = caneMarginPerTon - unitVCana - unitAdm;
  const resulMilho = cornMarginPerTon - unitVMilho;


  return {
    productMatrixData,
    caneProcessed,
    cornProcessed,
    caneMarginPerTon,
    cornMarginPerTon,
    totalCornRevenuePerTon,
    caneTotalCost,
    sugarRevenuePerTon,
    hydratedEthanolCaneRevenuePerTon,
    anhydrousEthanolCaneRevenuePerTon,
    totalCaneRevenuePerTon,
    cornTotalCost,
    hydratedEthanolCornRevenuePerTon,
    anhydrousEthanolCornRevenuePerTon,
    ddgRevenuePerTon,
    wdgRevenuePerTon,
    unitCO2Cana,
    unitCBIOCana,
    receitaCO2Cana,
    receitaCBIOCana,
    unitCO2Milho,
    receitaCO2Milho,
    receitaCBIOMilho,
    unitCBIOMilho,
    unitAdm,
    custoAdm,
    despesasVEtanolMilho,
    unitVMilho,
    despesasVCana,
    unitVCana,
    resulCana,
    resulMilho,
    rolEAC,
    rolEHC,
    receitasCana: {
      sugarRevenue,
      hydratedEthanolCaneRevenue,
      anhydrousEthanolCaneRevenue,
      totalPerTon: totalCaneRevenuePerTon
    },
    receitasMilho: {
      hydratedEthanolCornRevenue,
      anhydrousEthanolCornRevenue,
      ddgRevenue,
      wdgRevenue,
      totalPerTon: totalCornRevenuePerTon
    }
  };

}

/*=============================================================================================================================*/


export interface IndicadoresFinanceiros {
  totalProduction: {
    sugarCane: number;
    corn: number;
    sugar: number;
    totalEthanol: number;
    hydratedEthanol: number;
    anhydrousEthanol: number;
    ethanolCane: number;
    ethanolCorn: number;
    ddg: number;
    wdg: number;
    co2: number;
    cbio: number;
  };
  revenues: {
    sugar: number;
    hydratedEthanol: number;
    anhydrousEthanol: number;
    ddg: number;
    wdg: number;
    co2: number;
    cbio: number;
    OtherCosts: number;
  };
  costs: {
    caneRawMaterial: number;
    caneCct: number;
    caneIndustry: number;
    caneExpenses: number;
    cornRawMaterial: number;
    cornIndustry: number;
    cornBiomass: number;
    administration: number;
    OtherCosts: number;
    salesExpenses: {
      ethanol: number;
      sugar: number;
    };
  };
  totalRevenue: number;
  totalImpostos: number;
  totalDerivativosCambio: number;
  totalCosts: number;
  grossProfit: number;
  baseCosts: number;
  salesExpensesTotal: number;
  prodEAC: number;
  prodEHC: number;

}

export function calcularResumoFinanceiro(data: SimulatorData): IndicadoresFinanceiros {
  const prodVHP = (data.sugarCane.totalGroundCane * data.sugarCane.sugarPerTonCane) / 1000;
  const prodEHC = (data.sugarCane.totalGroundCane * data.sugarCane.hydratedEthanolPerTonCane) / 1000;
  const prodEAC = (data.sugarCane.totalGroundCane * data.sugarCane.anhydrousEthanolPerTonCane) / 1000;
  const prodEAM = (data.corn.groundCorn * data.cornTotalConvertedYield * 0.9556) / 1000;
  const prodDDG = (data.corn.groundCorn * 80) / 1000;
  const prodWDG = (data.corn.groundCorn * 187.5) / 1000;

  const totalProduction = {
    sugarCane: data.sugarCane.totalGroundCane,
    corn: data.corn.groundCorn,
    sugar: prodVHP,
    totalEthanol: prodEHC + prodEAC + data.corn.hydratedEthanol + data.corn.anhydrousEthanol,
    hydratedEthanol: prodEHC + data.corn.hydratedEthanol,
    anhydrousEthanol: prodEAC + prodEAM,
    ethanolCane: prodEHC + prodEAC,
    ethanolCorn: prodEAM,
    ddg: prodDDG,
    wdg: prodWDG,
    co2: data.otherProductions.co2Cane + data.otherProductions.co2Corn,
    cbio: (((prodEHC + prodEAC + prodEAM) * 0.52) / 920) * 1000
  };

  const revenues = {
    sugar: totalProduction.sugar * data.salesPrices.vhpSugarGross,
    hydratedEthanol: totalProduction.hydratedEthanol * data.salesPrices.hydratedEthanolGross,
    anhydrousEthanol: totalProduction.anhydrousEthanol * data.salesPrices.anhydrousEthanolGross,
    ddg: totalProduction.ddg * data.salesPrices.ddgGross,
    wdg: totalProduction.wdg * data.salesPrices.wdgGross,
    co2: totalProduction.co2 * data.salesPrices.co2Gross,
    cbio: totalProduction.cbio * data.salesPrices.cbioGross,
    OtherCosts: data.dre.otherRevenues,
  };

  const totalDerivativosCambio = data.dre.derivativesResult + data.dre.exchangeResult;

  const costs = {
    caneRawMaterial: data.sugarCane.totalGroundCane * data.productionCosts.caneRawMaterial,
    caneCct: data.sugarCane.totalGroundCane * data.productionCosts.caneCct,
    caneIndustry: data.sugarCane.totalGroundCane * data.productionCosts.caneIndustry,
    caneExpenses: data.sugarCane.totalGroundCane * data.productionCosts.caneExpenses,
    cornRawMaterial: data.corn.groundCorn * data.productionCosts.cornRawMaterial,
    cornIndustry: data.corn.groundCorn * data.productionCosts.cornIndustry,
    cornBiomass: data.corn.groundCorn * data.productionCosts.cornBiomass,
    administration: data.productionCosts.administration,
    OtherCosts: data.dre.otherCosts,
    salesExpenses: {
      ethanol: totalProduction.totalEthanol * data.productionCosts.salesExpenseEthanol,
      sugar: totalProduction.sugar * data.productionCosts.salesExpenseSugar,
    }
  };

  const totalRevenue = Object.values(revenues).reduce((sum, value) => sum + value, 0);

  const totalImpostos = data.dre.icmsTotal + data.dre.pisCofinsTotal + data.dre.ipiTotal +
    data.dre.inssTotal + data.dre.otherTaxes;

  const baseCosts = costs.caneRawMaterial + costs.caneCct + costs.caneIndustry +
    costs.caneExpenses + costs.cornRawMaterial + costs.cornIndustry +
    costs.cornBiomass + costs.OtherCosts;

  const salesExpensesTotal = costs.salesExpenses.ethanol + costs.salesExpenses.sugar;
  const totalCosts = baseCosts + salesExpensesTotal;

  const grossProfit = totalRevenue + totalDerivativosCambio - totalCosts - totalImpostos;

  return {
    totalProduction,
    revenues,
    costs,
    totalRevenue,
    totalImpostos,
    totalDerivativosCambio,
    salesExpensesTotal,
    totalCosts,
    grossProfit,
    baseCosts,
    prodEAC,
    prodEHC,

  };
}
