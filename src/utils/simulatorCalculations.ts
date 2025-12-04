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
  // Custo total de produção da cana (R$/ton)
  const totalCaneCost = data.productionCosts.caneRawMaterial +
    data.productionCosts.caneCct +
    data.productionCosts.caneIndustry +
    data.productionCosts.caneExpenses;

  // Custo total de produção do milho (R$/ton)
  const totalCornCost = data.productionCosts.cornRawMaterial +
    data.productionCosts.cornIndustry +
    data.productionCosts.cornBiomass;

  // Buscar proporções calculadas em calcularProducoesCana (já em %)
  const producoesCana = calcularProducoesCana(data.sugarCane);
  const vhpProportion = producoesCana.vhpProportion;
  const ehcProportion = producoesCana.ehcProportion;
  const eacProportion = producoesCana.eacProportion;

  // Fórmula: CPV = ((Custo Total × % Proporção) ÷ Rendimento) × 1000
  // As proporções estão em % (ex: 55.2), dividimos por 100
  const vhpSugarCpv = data.sugarCane.vhpSugar > 0 && data.sugarCane.sugarPerTonCane > 0
    ? (((totalCaneCost * (vhpProportion / 100)) / data.sugarCane.sugarPerTonCane) * 1000)
    : 0;

  const hydratedEthanolCaneCpv = data.sugarCane.hydratedEthanol > 0 && data.sugarCane.hydratedEthanolPerTonCane > 0
    ? (((totalCaneCost * (ehcProportion / 100)) / data.sugarCane.hydratedEthanolPerTonCane) * 1000)
    : 0;

  const anhydrousEthanolCaneCpv = data.sugarCane.anhydrousEthanol > 0 && data.sugarCane.anhydrousEthanolPerTonCane > 0
    ? (((totalCaneCost * (eacProportion / 100)) / data.sugarCane.anhydrousEthanolPerTonCane) * 1000)
    : 0;

  // Buscar proporções calculadas em calcularProducoesMilho (da tela de Produções de Milho)
  const producoesMilho = calcularProducoesMilho(
    data.corn,
    data.cornTotalConvertedYield,
    data.ddgYieldPerTon,
    data.wdgYieldPerTon
  );
  const ehmProportion = producoesMilho.ehmProportion;  // Em % (ex: 45.5)
  const eamProportion = producoesMilho.eamProportion;  // Em % (ex: 54.5)
  const ddgProportion = producoesMilho.ddgProportion;  // Em % (ex: 71.5)
  const wdgProportion = producoesMilho.wdgProportion;  // Em % (ex: 28.5)

  // Alocação de custos: 97% para etanóis, 3% para coprodutos
  const custoEtanol = totalCornCost * 0.97;
  const custoCoprodutos = totalCornCost * 0.03;

  // CPV Etanol Hidratado Milho = ((Custo × 0,97 × % EHM) ÷ Rendimento) × 1000
  const hydratedEthanolCornCpv = data.corn.hydratedEthanol > 0 && data.cornTotalConvertedYield > 0
    ? ((custoEtanol * (ehmProportion / 100)) / data.cornTotalConvertedYield) * 1000
    : 0;

  // CPV Etanol Anidro Milho = ((Custo × 0,97 × % EAM) ÷ Rendimento Anidro) × 1000
  const anhydrousPerTonCorn = data.cornTotalConvertedYield * 0.9556;
  const anhydrousEthanolCornCpv = data.corn.anhydrousEthanol > 0 && anhydrousPerTonCorn > 0
    ? ((custoEtanol * (eamProportion / 100)) / anhydrousPerTonCorn) * 1000
    : 0;

  // CPV DDG = ((Custo × 0,03 × % DDG) ÷ Rendimento DDG) × 1000
  const ddgCpv = data.corn.ddg > 0 && data.ddgYieldPerTon > 0
    ? ((custoCoprodutos * (ddgProportion / 100)) / data.ddgYieldPerTon) * 1000
    : 0;

  // CPV WDG = ((Custo × 0,03 × % WDG) ÷ Rendimento WDG) × 1000
  const wdgCpv = data.corn.wdg > 0 && data.wdgYieldPerTon > 0
    ? ((custoCoprodutos * (wdgProportion / 100)) / data.wdgYieldPerTon) * 1000
    : 0;

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

/*=============================================================================================================================*/

// TIPO para cenário salvo (usado para consolidado)
interface SavedScenarioData {
  sugarProduction: number;
  hydratedEthanolCane: number;
  hydratedEthanolCorn: number;
  anhydrousEthanolCane: number;
  anhydrousEthanolCorn: number;
  ddgProduction: number;
  wdgProduction: number;
  co2Production: number;
  cbioProduction: number;
  premissaCanaMoidaTotal: number;
  premissaMilhoMoidoTotal?: number;
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
  custoCanaTotal: number;
  custoMilhoTotal: number;
  margemContribuicao: number;
  despesasVendas: number;
  administracao: number;
  resultadoOperacional: number;
  receitaCanaTotal?: number;
  receitaMilhoTotal?: number;
  impostosCana?: number;
  impostosMilho?: number;
  receitaLiquidaCana?: number;
  receitaLiquidaMilho?: number;
  receitaLiquidaOutras?: number;
  margemCana?: number;
  margemMilho?: number;
  margemOutras?: number;
  cpvTotalAcucarVHP?: number;
  cpvTotalEHC?: number;
  cpvTotalEAC?: number;
  cpvTotalEHM?: number;
  cpvTotalEAM?: number;
  cpvTotalDDG?: number;
  cpvTotalWDG?: number;
}

export interface ConsolidatedDREData {
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
  caneProcessed: number;
  cornProcessed: number;
  
  // Receitas
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
  receitaCanaTotal: number;
  receitaMilhoTotal: number;
  
  // Impostos
  impostos: number;
  impostosCana: number;
  impostosMilho: number;
  
  // Receita Líquida
  receitaLiquida: number;
  receitaLiquidaCana: number;
  receitaLiquidaMilho: number;
  receitaLiquidaOutras: number;
  
  // Custos
  cpvTotal: number;
  custoCanaTotal: number;
  custoMilhoTotal: number;
  cpvTotalAcucarVHP: number;
  cpvTotalEHC: number;
  cpvTotalEAC: number;
  cpvTotalEHM: number;
  cpvTotalEAM: number;
  cpvTotalDDG: number;
  cpvTotalWDG: number;
  
  // Margens
  margemContribuicao: number;
  margemCana: number;
  margemMilho: number;
  margemOutras: number;
  
  // Despesas e Resultado
  despesasVendas: number;
  administracao: number;
  resultadoOperacional: number;
}

// RETORNA OS DADOS CONSOLIDADOS DIRETAMENTE DE scenario.data (SEM RECALCULAR)
export function getConsolidatedDREData(scenarios: Array<{ data: SavedScenarioData }>): ConsolidatedDREData {
  const zeroData: ConsolidatedDREData = {
    sugarProduction: 0,
    hydratedEthanolCane: 0,
    hydratedEthanolCorn: 0,
    anhydrousEthanolCane: 0,
    anhydrousEthanolCorn: 0,
    ddgProduction: 0,
    wdgProduction: 0,
    co2Production: 0,
    cbioProduction: 0,
    caneProcessed: 0,
    cornProcessed: 0,
    totalRevenue: 0,
    receitaAcucarVHP: 0,
    receitaEtanolHidratadoCana: 0,
    receitaEtanolAnidroCana: 0,
    receitaEtanolHidratadoMilho: 0,
    receitaEtanolAnidroMilho: 0,
    receitaDDG: 0,
    receitaWDG: 0,
    receitaCO2: 0,
    receitaCBIO: 0,
    receitaOther: 0,
    derivativosCambio: 0,
    receitaCanaTotal: 0,
    receitaMilhoTotal: 0,
    impostos: 0,
    impostosCana: 0,
    impostosMilho: 0,
    receitaLiquida: 0,
    receitaLiquidaCana: 0,
    receitaLiquidaMilho: 0,
    receitaLiquidaOutras: 0,
    cpvTotal: 0,
    custoCanaTotal: 0,
    custoMilhoTotal: 0,
    cpvTotalAcucarVHP: 0,
    cpvTotalEHC: 0,
    cpvTotalEAC: 0,
    cpvTotalEHM: 0,
    cpvTotalEAM: 0,
    cpvTotalDDG: 0,
    cpvTotalWDG: 0,
    margemContribuicao: 0,
    margemCana: 0,
    margemMilho: 0,
    margemOutras: 0,
    despesasVendas: 0,
    administracao: 0,
    resultadoOperacional: 0,
  };

  if (scenarios.length === 0) {
    return zeroData;
  }

  // Soma os valores de scenario.data de todos os cenários
  return scenarios.reduce((acc, scenario) => {
    const d = scenario.data;
    return {
      sugarProduction: acc.sugarProduction + (d.sugarProduction || 0),
      hydratedEthanolCane: acc.hydratedEthanolCane + (d.hydratedEthanolCane || 0),
      hydratedEthanolCorn: acc.hydratedEthanolCorn + (d.hydratedEthanolCorn || 0),
      anhydrousEthanolCane: acc.anhydrousEthanolCane + (d.anhydrousEthanolCane || 0),
      anhydrousEthanolCorn: acc.anhydrousEthanolCorn + (d.anhydrousEthanolCorn || 0),
      ddgProduction: acc.ddgProduction + (d.ddgProduction || 0),
      wdgProduction: acc.wdgProduction + (d.wdgProduction || 0),
      co2Production: acc.co2Production + (d.co2Production || 0),
      cbioProduction: acc.cbioProduction + (d.cbioProduction || 0),
      caneProcessed: acc.caneProcessed + (d.premissaCanaMoidaTotal || 0),
      cornProcessed: acc.cornProcessed + (d.premissaMilhoMoidoTotal || 0),
      totalRevenue: acc.totalRevenue + (d.totalRevenue || 0),
      receitaAcucarVHP: acc.receitaAcucarVHP + (d.receitaAcucarVHP || 0),
      receitaEtanolHidratadoCana: acc.receitaEtanolHidratadoCana + (d.receitaEtanolHidratadoCana || 0),
      receitaEtanolAnidroCana: acc.receitaEtanolAnidroCana + (d.receitaEtanolAnidroCana || 0),
      receitaEtanolHidratadoMilho: acc.receitaEtanolHidratadoMilho + (d.receitaEtanolHidratadoMilho || 0),
      receitaEtanolAnidroMilho: acc.receitaEtanolAnidroMilho + (d.receitaEtanolAnidroMilho || 0),
      receitaDDG: acc.receitaDDG + (d.receitaDDG || 0),
      receitaWDG: acc.receitaWDG + (d.receitaWDG || 0),
      receitaCO2: acc.receitaCO2 + (d.receitaCO2 || 0),
      receitaCBIO: acc.receitaCBIO + (d.receitaCBIO || 0),
      receitaOther: acc.receitaOther + (d.receitaOther || 0),
      derivativosCambio: acc.derivativosCambio + (d.derivativosCambio || 0),
      receitaCanaTotal: acc.receitaCanaTotal + (d.receitaCanaTotal || 0),
      receitaMilhoTotal: acc.receitaMilhoTotal + (d.receitaMilhoTotal || 0),
      impostos: acc.impostos + (d.impostos || 0),
      impostosCana: acc.impostosCana + (d.impostosCana || 0),
      impostosMilho: acc.impostosMilho + (d.impostosMilho || 0),
      receitaLiquida: acc.receitaLiquida + (d.receitaLiquida || 0),
      receitaLiquidaCana: acc.receitaLiquidaCana + (d.receitaLiquidaCana || 0),
      receitaLiquidaMilho: acc.receitaLiquidaMilho + (d.receitaLiquidaMilho || 0),
      receitaLiquidaOutras: acc.receitaLiquidaOutras + (d.receitaLiquidaOutras || 0),
      cpvTotal: acc.cpvTotal + (d.cpvTotal || 0),
      custoCanaTotal: acc.custoCanaTotal + (d.custoCanaTotal || 0),
      custoMilhoTotal: acc.custoMilhoTotal + (d.custoMilhoTotal || 0),
      cpvTotalAcucarVHP: acc.cpvTotalAcucarVHP + (d.cpvTotalAcucarVHP || 0),
      cpvTotalEHC: acc.cpvTotalEHC + (d.cpvTotalEHC || 0),
      cpvTotalEAC: acc.cpvTotalEAC + (d.cpvTotalEAC || 0),
      cpvTotalEHM: acc.cpvTotalEHM + (d.cpvTotalEHM || 0),
      cpvTotalEAM: acc.cpvTotalEAM + (d.cpvTotalEAM || 0),
      cpvTotalDDG: acc.cpvTotalDDG + (d.cpvTotalDDG || 0),
      cpvTotalWDG: acc.cpvTotalWDG + (d.cpvTotalWDG || 0),
      margemContribuicao: acc.margemContribuicao + (d.margemContribuicao || 0),
      margemCana: acc.margemCana + (d.margemCana || 0),
      margemMilho: acc.margemMilho + (d.margemMilho || 0),
      margemOutras: acc.margemOutras + (d.margemOutras || 0),
      despesasVendas: acc.despesasVendas + (d.despesasVendas || 0),
      administracao: acc.administracao + (d.administracao || 0),
      resultadoOperacional: acc.resultadoOperacional + (d.resultadoOperacional || 0),
    };
  }, zeroData);
}

/*=============================================================================================================================*/

// CALCULA DADOS CONSOLIDADOS DE MÚLTIPLOS CENÁRIOS
export function calculateConsolidatedData(scenarios: Array<{ originalData: SimulatorData }>): SimulatorData {
  // Quando não há cenários salvos, retorna objeto com todos os valores zerados
  if (scenarios.length === 0) {
    return {
      atr: 0,
      extractionArt: 0,
      effectiveHours: 0,
      generalTimeEfficiency: 0,
      totalConvertedYield: 0,
      cornTotalConvertedYield: 0,
      industrialTimeEfficiency: 0,
      cornProcessedPerDay: 0,
      ddgYieldPerTon: 0,
      wdgYieldPerTon: 0,
      sugarCane: {
        totalGroundCane: 0,
        sugarMix: 0,
        ethanolMix: 0,
        sugarGroundCane: 0,
        ethanolGroundCane: 0,
        sugarPerTonCane: 0,
        hydratedEthanolPerTonCane: 0,
        anhydrousEthanolPerTonCane: 0,
        vhpSugar: 0,
        hydratedEthanol: 0,
        anhydrousEthanol: 0,
      },
      corn: {
        groundCorn: 0,
        hydratedEthanol: 0,
        anhydrousEthanol: 0,
        ddg: 0,
        wdg: 0,
      },
      otherProductions: {
        co2Cane: 0,
        co2Corn: 0,
        cbio: 0,
      },
      commercialization: {
        vhpSugar: 0,
        hydratedEthanolCane: 0,
        anhydrousEthanolCane: 0,
        cornEthanol: 0,
        ddg: 0,
        wdg: 0,
      },
      salesPrices: {
        vhpSugarGross: 0,
        hydratedEthanolGross: 0,
        anhydrousEthanolGross: 0,
        ddgGross: 0,
        wdgGross: 0,
        co2Gross: 0,
        cbioGross: 0,
        icmsEthanol: 0,
        pisCofinsEthanol: 0,
        icmsDdg: 0,
        pisccofinsDdg: 0,
      },
      productionCosts: {
        caneRawMaterial: 0,
        caneCct: 0,
        caneIndustry: 0,
        caneExpenses: 0,
        cornRawMaterial: 0,
        cornIndustry: 0,
        cornBiomass: 0,
        administration: 0,
        salesExpenseEthanol: 0,
        salesExpenseSugar: 0,
      },
      dre: {
        derivativesResult: 0,
        exchangeResult: 0,
        otherRevenues: 0,
        icmsTotal: 0,
        pisCofinsTotal: 0,
        ipiTotal: 0,
        inssTotal: 0,
        otherTaxes: 0,
        otherCosts: 0,
      },
    };
  }

  // Se houver apenas um cenário, retorna diretamente
  if (scenarios.length === 1) {
    return scenarios[0].originalData;
  }

  // Consolidar somando os dados de todos os cenários
  const consolidated: SimulatorData = JSON.parse(JSON.stringify(initialSimulatorData));

  scenarios.forEach(scenario => {
    const data = scenario.originalData;

    // Somar produções de cana
    consolidated.sugarCane.totalGroundCane += data.sugarCane.totalGroundCane;
    consolidated.sugarCane.vhpSugar += data.sugarCane.vhpSugar;
    consolidated.sugarCane.hydratedEthanol += data.sugarCane.hydratedEthanol;
    consolidated.sugarCane.anhydrousEthanol += data.sugarCane.anhydrousEthanol;

    // Somar produções de milho
    consolidated.corn.groundCorn += data.corn.groundCorn;
    consolidated.corn.hydratedEthanol += data.corn.hydratedEthanol;
    consolidated.corn.anhydrousEthanol += data.corn.anhydrousEthanol;
    consolidated.corn.ddg += data.corn.ddg;
    consolidated.corn.wdg += data.corn.wdg;

    // Somar outras produções
    consolidated.otherProductions.co2Cane += data.otherProductions.co2Cane;
    consolidated.otherProductions.co2Corn += data.otherProductions.co2Corn;
    consolidated.otherProductions.cbio += data.otherProductions.cbio;

    // Somar comercialização
    consolidated.commercialization.vhpSugar += data.commercialization.vhpSugar;
    consolidated.commercialization.hydratedEthanolCane += data.commercialization.hydratedEthanolCane;
    consolidated.commercialization.anhydrousEthanolCane += data.commercialization.anhydrousEthanolCane;
    consolidated.commercialization.cornEthanol += data.commercialization.cornEthanol;
    consolidated.commercialization.ddg += data.commercialization.ddg;
    consolidated.commercialization.wdg += data.commercialization.wdg;

    // Somar DRE
    consolidated.dre.otherRevenues += data.dre.otherRevenues;
    consolidated.dre.derivativesResult += data.dre.derivativesResult;
    consolidated.dre.exchangeResult += data.dre.exchangeResult;
    consolidated.dre.otherCosts += data.dre.otherCosts;
    consolidated.dre.ipiTotal += data.dre.ipiTotal;
    consolidated.dre.inssTotal += data.dre.inssTotal;
    consolidated.dre.otherTaxes += data.dre.otherTaxes;
  });

  // Calcular médias ponderadas para valores unitários (preços, custos, rendimentos)
  const totalCana = scenarios.reduce((sum, s) => sum + s.originalData.sugarCane.totalGroundCane, 0);
  const totalMilho = scenarios.reduce((sum, s) => sum + s.originalData.corn.groundCorn, 0);

  if (totalCana > 0) {
    // Média ponderada dos rendimentos da cana
    consolidated.sugarCane.sugarPerTonCane = scenarios.reduce((sum, s) => 
      sum + s.originalData.sugarCane.sugarPerTonCane * s.originalData.sugarCane.totalGroundCane, 0) / totalCana;
    consolidated.sugarCane.hydratedEthanolPerTonCane = scenarios.reduce((sum, s) => 
      sum + s.originalData.sugarCane.hydratedEthanolPerTonCane * s.originalData.sugarCane.totalGroundCane, 0) / totalCana;
    consolidated.sugarCane.anhydrousEthanolPerTonCane = scenarios.reduce((sum, s) => 
      sum + s.originalData.sugarCane.anhydrousEthanolPerTonCane * s.originalData.sugarCane.totalGroundCane, 0) / totalCana;

    // Média ponderada dos custos da cana
    consolidated.productionCosts.caneRawMaterial = scenarios.reduce((sum, s) => 
      sum + s.originalData.productionCosts.caneRawMaterial * s.originalData.sugarCane.totalGroundCane, 0) / totalCana;
    consolidated.productionCosts.caneCct = scenarios.reduce((sum, s) => 
      sum + s.originalData.productionCosts.caneCct * s.originalData.sugarCane.totalGroundCane, 0) / totalCana;
    consolidated.productionCosts.caneIndustry = scenarios.reduce((sum, s) => 
      sum + s.originalData.productionCosts.caneIndustry * s.originalData.sugarCane.totalGroundCane, 0) / totalCana;
    consolidated.productionCosts.caneExpenses = scenarios.reduce((sum, s) => 
      sum + s.originalData.productionCosts.caneExpenses * s.originalData.sugarCane.totalGroundCane, 0) / totalCana;
    consolidated.productionCosts.administration = scenarios.reduce((sum, s) => 
      sum + s.originalData.productionCosts.administration * s.originalData.sugarCane.totalGroundCane, 0) / totalCana;
  }

  if (totalMilho > 0) {
    // Média ponderada dos rendimentos do milho
    consolidated.cornTotalConvertedYield = scenarios.reduce((sum, s) => 
      sum + s.originalData.cornTotalConvertedYield * s.originalData.corn.groundCorn, 0) / totalMilho;
    consolidated.ddgYieldPerTon = scenarios.reduce((sum, s) => 
      sum + s.originalData.ddgYieldPerTon * s.originalData.corn.groundCorn, 0) / totalMilho;
    consolidated.wdgYieldPerTon = scenarios.reduce((sum, s) => 
      sum + s.originalData.wdgYieldPerTon * s.originalData.corn.groundCorn, 0) / totalMilho;

    // Média ponderada dos custos do milho
    consolidated.productionCosts.cornRawMaterial = scenarios.reduce((sum, s) => 
      sum + s.originalData.productionCosts.cornRawMaterial * s.originalData.corn.groundCorn, 0) / totalMilho;
    consolidated.productionCosts.cornIndustry = scenarios.reduce((sum, s) => 
      sum + s.originalData.productionCosts.cornIndustry * s.originalData.corn.groundCorn, 0) / totalMilho;
    consolidated.productionCosts.cornBiomass = scenarios.reduce((sum, s) => 
      sum + s.originalData.productionCosts.cornBiomass * s.originalData.corn.groundCorn, 0) / totalMilho;
  }

  // Média simples para preços de venda (assumindo mesmo mercado)
  const n = scenarios.length;
  consolidated.salesPrices.vhpSugarGross = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.vhpSugarGross, 0) / n;
  consolidated.salesPrices.hydratedEthanolGross = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.hydratedEthanolGross, 0) / n;
  consolidated.salesPrices.anhydrousEthanolGross = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.anhydrousEthanolGross, 0) / n;
  consolidated.salesPrices.ddgGross = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.ddgGross, 0) / n;
  consolidated.salesPrices.wdgGross = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.wdgGross, 0) / n;
  consolidated.salesPrices.co2Gross = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.co2Gross, 0) / n;
  consolidated.salesPrices.cbioGross = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.cbioGross, 0) / n;
  consolidated.salesPrices.icmsEthanol = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.icmsEthanol, 0) / n;
  consolidated.salesPrices.pisCofinsEthanol = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.pisCofinsEthanol, 0) / n;
  consolidated.salesPrices.icmsDdg = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.icmsDdg, 0) / n;
  consolidated.salesPrices.pisccofinsDdg = scenarios.reduce((sum, s) => sum + s.originalData.salesPrices.pisccofinsDdg, 0) / n;

  // Despesas com vendas
  consolidated.productionCosts.salesExpenseEthanol = scenarios.reduce((sum, s) => sum + s.originalData.productionCosts.salesExpenseEthanol, 0) / n;
  consolidated.productionCosts.salesExpenseSugar = scenarios.reduce((sum, s) => sum + s.originalData.productionCosts.salesExpenseSugar, 0) / n;

  return consolidated;
}

import { initialSimulatorData } from '@/types/simulator';
