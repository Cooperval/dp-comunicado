import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumericInput } from '@/components/ui/numeric-input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Droplets } from 'lucide-react';
import { GiCorn, GiSugarCane } from 'react-icons/gi';

/* ===================== THEME / TOKENS ===================== */
const palette = {
  bg: "#f6f9fb",
  cardBg: "#ffffff",
  text: "#0f172a",
  mutedText: "#64748b",
  border: "#e5e7eb",
  primary: "#0ea5e9",
  primarySoft: "rgba(14,165,233,0.12)",
  green: "#16a34a",
  greenSoft: "rgba(22,163,74,0.10)",
  blue: "#2563eb",
  blueSoft: "rgba(37,99,235,0.10)",
  zebra: "#f8fafc",
  shadow: "0 6px 24px rgba(2,8,23,0.06)",
};

/* ===================== INTERFACES ===================== */
interface Indicador {
  nome: string;
  valor?: string;
  erro?: string;
  ajuste?: string | null;
  data?: string;
}

type DolarPTAX = {
  nome: string;
  compra: number | string;
  venda: number | string;
  dataHoraCotacao?: string;
  fonte?: string;
};

/* ===================== HELPERS ===================== */
function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function formatCurrency(value: number, currency = 'BRL') {
  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPTAXStamp(s: string, withSeconds = false) {
  if (!s) return "—";
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/
  );
  if (!m) return s;

  const [, yyyy, mm, dd, HH, MM, SS] = m;
  return withSeconds
    ? `${dd}/${mm}/${yyyy} ${HH}:${MM}:${SS || "00"}`
    : `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
}

/* ===================== MAIN COMPONENT ===================== */
const MarketQuotations = () => {
  // Sugar VHP calculation states
  const [quotationCents, setQuotationCents] = useState<number>(0);
  const [tradingDiscount, setTradingDiscount] = useState(-0.08);
  const [dollarRate, setDollarRate] = useState<number>(0);

  // Other products states
  const [ethanolAnhydrous, setEthanolAnhydrous] = useState<number>(0);
  const [ethanolHydrated, setEthanolHydrated] = useState<number>(0);
  const [soybeanPrice, setSoybeanPrice] = useState<number>(0);
  const [cornPrice, setCornPrice] = useState<number>(0);
  const [sugarcanePrice, setSugarcanePrice] = useState<number>(0);

  // Sugar VHP calculated values
  const [netQuotationCents, setNetQuotationCents] = useState(0);
  const [netQuotationUSD, setNetQuotationUSD] = useState(0);
  const [polarizationPremium, setPolarizationPremium] = useState(0);
  const [finalResultBRL, setFinalResultBRL] = useState(0);
  const [finalResultBRLEtanol, setFinalResultBRLEtanol] = useState(0);

  // Date states
  const [soybeanDate, setSoybeanDate] = useState("");
  const [cornDate, setCornDate] = useState("");
  const [sugarcaneDate, setSugarcaneDate] = useState("");
  const [anhydrousDate, setAnhydrousDate] = useState("");
  const [hydratedDate, setHydratedDate] = useState("");
  const [sugarDate, setSugarDate] = useState("");
  const [dollarDate, setDollarDate] = useState("");

  // Calculate Sugar VHP values in real time
  useEffect(() => {
    const netCents = quotationCents + tradingDiscount;
    const netUSD = netCents * 22.462;
    const premium = netUSD * 1.042;
    const finalBRL = premium * dollarRate;
    const finalEtanol = finalBRL * (50 / 33);

    setNetQuotationCents(netCents);
    setNetQuotationUSD(netUSD);
    setPolarizationPremium(premium);
    setFinalResultBRL(finalBRL);
    setFinalResultBRLEtanol(finalEtanol);
  }, [quotationCents, tradingDiscount, dollarRate]);

  // Fetch data
  useEffect(() => {
    async function fetchSoja() {
      try {
        const response = await fetch('/api-gestao/cotacao/soja');
        const data: Indicador = await response.json();
        if (data.valor) {
          const parsed = parseFloat(data.valor.replace(',', '.'));
          if (!isNaN(parsed)) setSoybeanPrice(parsed);
        }
        if (data.data) setSoybeanDate(String(data.data));
      } catch (error) {
        console.error('Erro ao buscar indicador de soja:', error);
      }
    }
    fetchSoja();
  }, []);

  useEffect(() => {
    async function fetchMilho() {
      try {
        const response = await fetch('/api-gestao/cotacao/milho');
        const data: Indicador = await response.json();
        if (data.valor) {
          const parsed = parseFloat(data.valor.replace(',', '.'));
          if (!isNaN(parsed)) setCornPrice(parsed);
        }
        if (data.data) setCornDate(String(data.data));
      } catch (error) {
        console.error('Erro ao buscar indicador de milho:', error);
      }
    }
    fetchMilho();
  }, []);

  useEffect(() => {
    async function fetchCana() {
      try {
        const response = await fetch('/api-gestao/cotacao/cana');
        const data: Indicador = await response.json();
        if (data.valor) {
          const parsed = parseFloat(data.valor.replace(',', '.'));
          if (!isNaN(parsed)) setSugarcanePrice(parsed);
        }
        if (data.data) setSugarcaneDate(String(data.data));
      } catch (error) {
        console.error('Erro ao buscar indicador de cana:', error);
      }
    }
    fetchCana();
  }, []);

  useEffect(() => {
    async function fetchEtanolAnidro() {
      try {
        const response = await fetch('/api-gestao/cotacao/etanol-anidro');
        const data: Indicador = await response.json();
        if (data.valor) {
          const parsed = parseFloat(data.valor.replace(',', '.'));
          if (!isNaN(parsed)) setEthanolAnhydrous(parsed);
        }
        if (data.data) setAnhydrousDate(String(data.data));
      } catch (error) {
        console.error('Erro ao buscar indicador de etanol anidro:', error);
      }
    }
    fetchEtanolAnidro();
  }, []);

  useEffect(() => {
    async function fetchEtanolHidratado() {
      try {
        const response = await fetch('/api-gestao/cotacao/etanol-hidratado');
        const data: Indicador = await response.json();
        if (data.valor) {
          const parsed = parseFloat(data.valor.replace(',', '.'));
          if (!isNaN(parsed)) setEthanolHydrated(parsed);
        }
        if (data.data) setHydratedDate(String(data.data));
      } catch (error) {
        console.error('Erro ao buscar indicador de etanol hidratado:', error);
      }
    }
    fetchEtanolHidratado();
  }, []);

  useEffect(() => {
    async function fetchAcucar() {
      try {
        const response = await fetch('/api-gestao/cotacao/acucar');
        const data: Indicador = await response.json();
        if (data.ajuste) {
          const parsed = parseFloat(data.ajuste.replace(',', '.'));
          if (!isNaN(parsed)) setQuotationCents(parsed);
        }
        if (data.data) setSugarDate(String(data.data));
      } catch (error) {
        console.error('Erro ao buscar indicador de açúcar:', error);
      }
    }
    fetchAcucar();
  }, []);

  useEffect(() => {
    async function fetchDolar() {
      try {
        const resp = await fetch('/api-gestao/cotacao/dolar');
        const data: DolarPTAX = await resp.json();
        const venda = toNumber(data.venda);
        if (venda != null) setDollarRate(venda);
        if (data.dataHoraCotacao) setDollarDate(String(data.dataHoraCotacao));
      } catch (error) {
        console.error('Erro ao buscar indicador de dólar:', error);
      }
    }
    fetchDolar();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-6 pb-12">
        {/* Main Dashboard */}
        <div className="grid grid-cols-12 gap-2 mb-2">
          {/* Sugar VHP - Featured Card */}
          <div className="col-span-12 lg:col-span-7 flex flex-col">
            <Card className="relative overflow-hidden shadow-card bg-gradient-to-br  hover:shadow-primary/10 transition-all duration-500 animate-scale-in h-full flex flex-col justify-between">
              <CardHeader className="relative pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                    <GiSugarCane className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Açúcar VHP
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="relative space-y-6">
                {/* Input Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="group">
                    <NumericInput
                      label="Cotação"
                      value={quotationCents}
                      onChange={setQuotationCents}
                      unit="cents/lb"
                      step={0.01}
                      className="bg-gradient-to-r from-muted/50 to-muted/30 border-primary/20 hover:border-primary/40 transition-colors"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">Referência: {sugarDate || "—"}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">Fonte: UDOP - Açúcar NY nº11 Futuros</p>
                  </div>
                  <div className="group">
                    <NumericInput
                      label="Basis"
                      value={tradingDiscount}
                      onChange={setTradingDiscount}
                      unit="cents/lb"
                      step={0.01}
                      className="bg-gradient-to-r from-muted/50 to-muted/30 border-primary/20 hover:border-primary/40 transition-colors"
                    />
                  </div>
                  <div className="group">
                    <NumericInput
                      label="Cotação do Dólar"
                      value={dollarRate}
                      onChange={setDollarRate}
                      unit="R$"
                      step={0.0001}
                      className="bg-gradient-to-r from-muted/50 to-muted/30 border-primary/20 hover:border-primary/40 transition-colors"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">Referência: {dollarDate ? formatPTAXStamp(dollarDate) : "—"}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">Fonte: Dólar PTAX</p>
                  </div>
                </div>

                {/* Calculations */}
                <div className="bg-gradient-to-r from-muted/30 to-muted/20 rounded-xl p-4 border border-primary/10">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Cálculos Automáticos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="text-center">
                      <Badge variant="outline" className="w-full justify-center py-2 bg-gradient-to-r from-primary/10 to-primary/5">
                        {netQuotationCents.toFixed(2)} cents
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Cotação Líquida</p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="w-full justify-center py-2 bg-gradient-to-r from-primary/10 to-primary/5">
                        {formatCurrency(netQuotationUSD, 'USD')}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">USD/ton sem Pol</p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="w-full justify-center py-2 bg-gradient-to-r from-primary/10 to-primary/5">
                        {formatCurrency(polarizationPremium, 'USD')}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">USD/ton com Pol</p>
                    </div>
                  </div>
                </div>

                {/* Final Result */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl blur-sm"></div>
                  <div className="relative bg-gradient-to-r from-primary/20 to-primary/10 p-6 rounded-xl border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Açúcar VHP (R$/t):</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        {formatCurrency(finalResultBRL)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ethanol Parity */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl blur-sm"></div>
                  <div className="relative bg-gradient-to-r from-primary/20 to-primary/10 p-6 rounded-xl border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Paridade do Etanol Equivalente (R$/m³):</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        {formatCurrency(finalResultBRLEtanol)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Fonte: UDOP - Açúcar NY nº11 Futuros</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Overview */}
          <div className="col-span-12 lg:col-span-5 h-full">
            <div className="flex flex-col h-full">
              <Card className="flex-1 bg-gradient-to-br  border-blue-200/50 hover:shadow-lg transition-all duration-300 animate-fade-in mb-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3 text-2xl">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 shadow-lg">
                      <Droplets className="h-7 w-7 text-blue-600" />
                    </div>
                    <span className="font-semibold text-blue-700">Etanol</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <NumericInput
                        label="Anidro"
                        value={ethanolAnhydrous}
                        onChange={setEthanolAnhydrous}
                        unit="R$/L"
                        step={0.0001}
                        
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">Referência: {anhydrousDate || "—"}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">Fonte: CEPEA/ESALQ</p>
                    </div>
                    <div>
                      <NumericInput
                        label="Hidratado"
                        value={ethanolHydrated}
                        onChange={setEthanolHydrated}
                        unit="R$/L"
                        step={0.01}
                        
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">Referência: {hydratedDate || "—"}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">Fonte: CEPEA/ESALQ</p>
                    </div>
                  </div>

                </CardContent>
              </Card>

              <Card className="flex-1 bg-gradient-to-br  border-green-200/50 hover:shadow-lg transition-all duration-300 animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3 text-2xl">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-green-50 shadow-lg">
                      <GiCorn className="h-7 w-7 text-green-600" />
                    </div>
                    <span className="font-semibold text-green-700">Grãos e Cana</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <NumericInput
                        label="Soja"
                        value={soybeanPrice}
                        onChange={setSoybeanPrice}
                        unit="R$/saca"
                        step={0.01}
                        
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">Referência: {soybeanDate || "—"}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">Fonte: CEPEA/ESALQ</p>
                    </div>
                    <div>
                      <NumericInput
                        label="Milho"
                        value={cornPrice}
                        onChange={setCornPrice}
                        unit="R$/saca"
                        step={0.01}
                        
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">Referência: {cornDate || "—"}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">Fonte: CEPEA/ESALQ</p>
                    </div>
                    <div>
                      <NumericInput
                        label="Cana"
                        value={sugarcanePrice}
                        onChange={setSugarcanePrice}
                        unit="R$/t"
                        step={0.01}
                        
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">Referência: {sugarcaneDate || "—"}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">Fonte: UDOP</p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketQuotations;