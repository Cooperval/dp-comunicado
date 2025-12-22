export interface OperationPremises {
  // Operação Cana
  atr: number;                     // Açúcares Totais Recuperáveis por tonelada de cana (kg/ton)
  extractionArt: number;          // % de ART extraído na indústria (eficiência industrial)
  effectiveHours: number;         // Total de horas efetivas de operação no mês
  generalTimeEfficiency: number;  // Eficiência do tempo geral (% do tempo realmente usado)
  totalConvertedYield: number;    // Rendimento total convertido (litros de etanol por tonelada de cana)

  // Operação Milho
  cornTotalConvertedYield: number; // Rendimento total convertido (L/ton) de etanol por milho
  industrialTimeEfficiency: number; // Eficiência industrial da planta de milho
  cornProcessedPerDay: number;      // Quantidade de milho processado por dia (toneladas)
  ddgYieldPerTon: number;           // Rendimento DDG por tonelada de milho (kg/ton)
  wdgYieldPerTon: number;           // Rendimento WDG por tonelada de milho (kg/ton)
}


export interface SugarCaneProduction {
  // Moagem de Cana
  totalGroundCane: number;       // Total de cana moída (toneladas)
  sugarMix: number;              // Mix açúcar (%) - percentual destinado a açúcar
  ethanolMix: number;            // Mix etanol (%) - percentual destinado a etanol
  sugarGroundCane: number;       // Calculado: totalGroundCane * sugarMix / 100
  ethanolGroundCane: number;     // Calculado: totalGroundCane * ethanolMix / 100
  sugarPerTonCane: number;       // Quantidade de açúcar produzida por tonelada de cana (kg/t)
  hydratedEthanolPerTonCane: number; // Etanol hidratado produzido por tonelada de cana (L/t)
  anhydrousEthanolPerTonCane: number; // Etanol anidro produzido por tonelada de cana (L/t)

  // Produção efetiva da Cana
  vhpSugar: number;              // Açúcar VHP produzido (toneladas)
  hydratedEthanol: number;       // Etanol hidratado total produzido (m³)
  anhydrousEthanol: number;      // Etanol anidro total produzido (m³)
}


export interface CornProduction {
  groundCorn: number;            // Milho moído (toneladas)
  hydratedEthanol: number;       // Etanol hidratado produzido (m³)
  anhydrousEthanol: number;      // Etanol anidro produzido (m³)
  ddg: number;                   // DDG (resíduo proteico seco) produzido (toneladas)
  wdg: number;                   // WDG (resíduo úmido) produzido (toneladas)
}


export interface OtherProductions {
  co2Cane: number;               // CO₂ produzido a partir da cana (toneladas)
  co2Corn: number;               // CO₂ produzido a partir do milho (toneladas)
  cbio: number;                  // Créditos de descarbonização (CBIOs) gerados (unidades)
}


export interface Commercialization {
  vhpSugar: number;              // Açúcar comercializado (toneladas)
  hydratedEthanolCane: number;   // Etanol hidratado (cana) vendido (m³)
  anhydrousEthanolCane: number;  // Etanol anidro (cana) vendido (m³)
  cornEthanol: number;           // Etanol (milho) vendido (m³)
  ddg: number;                   // DDG vendido (toneladas)
  wdg: number;                   // WDG vendido (toneladas)
}


export interface SalesPrices {
  // Preços brutos de venda por produto
  vhpSugarGross: number;
  hydratedEthanolGross: number;
  anhydrousEthanolGross: number;
  ddgGross: number;
  wdgGross: number;
  co2Gross: number;
  cbioGross: number;

  // Impostos aplicados sobre os produtos
  icmsEthanol: number;
  pisCofinsEthanol: number;
  icmsDdg: number;
  pisccofinsDdg: number;
}


export interface ProductionCosts {
  // Custos por tonelada de cana
  caneRawMaterial: number;
  caneCct: number;
  caneIndustry: number;
  caneExpenses: number;

  // Custos por tonelada de milho
  cornRawMaterial: number;
  cornIndustry: number;
  cornBiomass: number;

  // Custo administrativo por tonelada de cana
  administration: number;

  // Despesas de comercialização
  salesExpenseEthanol: number;  // R$/m³ de etanol
  salesExpenseSugar: number;    // R$/ton de açúcar
}


export interface DRE {
  derivativesResult: number;     // Resultado com derivativos financeiros
  exchangeResult: number;        // Ganhos ou perdas cambiais
  otherRevenues: number;         
  otherCosts: number;            

  // Tributos
  icmsTotal: number;
  pisCofinsTotal: number;
  ipiTotal: number;
  inssTotal: number;
  otherTaxes: number;
}


export interface SimulatorData extends OperationPremises {
  sugarCane: SugarCaneProduction;
  corn: CornProduction;
  otherProductions: OtherProductions;
  commercialization: Commercialization;
  salesPrices: SalesPrices;
  productionCosts: ProductionCosts;
  dre: DRE;
}

export const initialSimulatorData: SimulatorData = {
  // Operation Premises
  atr: 130,
  extractionArt: 96.5,
  effectiveHours: 466,
  generalTimeEfficiency: 62.9,
  totalConvertedYield: 86.3,
  cornTotalConvertedYield: 433,
  industrialTimeEfficiency: 95.8,
  cornProcessedPerDay: 368,
  ddgYieldPerTon: 40,
  wdgYieldPerTon: 287.5,

  // Sugar Cane Production
  sugarCane: {
    totalGroundCane: 176148,
    sugarMix: 56.2,              // 99003 / 176148 * 100
    ethanolMix: 43.8,            // 77145 / 176148 * 100
    sugarGroundCane: 99003,
    ethanolGroundCane: 77145,
    sugarPerTonCane: 70,
    hydratedEthanolPerTonCane: 6.6,
    anhydrousEthanolPerTonCane: 28.4,
    vhpSugar: 12330.4,
    hydratedEthanol: 1164.9,
    anhydrousEthanol: 5000,
  },

  // Corn Production
  corn: {
    groundCorn: 8049.47,
    hydratedEthanol: 0,
    anhydrousEthanol: 3597.4,
    ddg: 695.5,
    wdg: 1630.1,
  },

  // Other Productions
  otherProductions: {
    co2Cane: 0,
    co2Corn: 0,
    cbio: 0,
  },

  // Commercialization
  commercialization: {
    vhpSugar: 0,
    hydratedEthanolCane: 0,
    anhydrousEthanolCane: 0,
    cornEthanol: 0,
    ddg: 0,
    wdg: 0,
  },

  // Sales Prices
  salesPrices: {
    vhpSugarGross: 1879.25,
    hydratedEthanolGross: 2998,
    anhydrousEthanolGross: 3066.12,
    ddgGross: 1150,
    wdgGross: 350,
    co2Gross: 200,
    cbioGross: 35,
    icmsEthanol: 12,
    pisCofinsEthanol: 192.2,
    icmsDdg: 0,
    pisccofinsDdg: 0,
  },

  // Production Costs
  productionCosts: {
    caneRawMaterial: 116.7,
    caneCct: 50.5,
    caneIndustry: 26.5,
    caneExpenses: 3,
    cornRawMaterial: 866.7,
    cornIndustry: 150,
    cornBiomass: 48,
    administration: 9.8,
    salesExpenseEthanol: 5.04,
    salesExpenseSugar: 165.09,
  },

  // DRE
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
