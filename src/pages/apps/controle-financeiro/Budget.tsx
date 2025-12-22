import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { FileText, TrendingUp, TrendingDown, ChevronRight, ChevronDown, TreePine, Settings, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfYear, endOfYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import { BudgetToolbar } from "@/pages/apps/controle-financeiro/components/budget/BudgetToolbar";
import { CompanyBranchFilter } from "@/pages/apps/controle-financeiro/components/filters/CompanyBranchFilter";
import { useCompanyBranchFilter } from "@/pages/apps/controle-financeiro/hooks/useCompanyBranchFilter";
import { ViewType, MONTH_NAMES, QUARTER_LABELS, SEMESTER_LABELS, YEAR_LABEL } from "@/pages/apps/controle-financeiro/constants/financialConstants";
import { formatCurrency } from "@/pages/apps/controle-financeiro/utils/formatters";
import { MONTHS_SHORT, MONTH_OPTIONS, CHUNK_SIZE } from "@/pages/apps/controle-financeiro/constants/budgetConstants";
import type {
  TransactionData,
  DRELine,
  DREConfiguration,
  CommitmentGroup,
  Commitment,
  CommitmentType,
  Configs,
  BudgetForecast,
  LineType
} from "@/pages/apps/controle-financeiro/types/budget";


const Budget: React.FC = () => {
  const { companyId } = useAuth();
  
  // Company and Branch filter
  const companyBranchFilter = useCompanyBranchFilter();
  
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [viewType, setViewType] = useState<ViewType>('month');
  const [dreLines, setDreLines] = useState<DRELine[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Configuration state (kept for potential future use)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isAddCommitmentDialogOpen, setIsAddCommitmentDialogOpen] = useState(false);
  const [selectedLineType, setSelectedLineType] = useState<"revenue" | "cost" | "expense">("revenue");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedCommitmentId, setSelectedCommitmentId] = useState("");
  const [dreConfigurations, setDreConfigurations] = useState<DREConfiguration[]>([]);
  const [groups, setGroups] = useState<CommitmentGroup[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [commitmentTypes, setCommitmentTypes] = useState<CommitmentType[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Estados para o modal de parâmetros de orçamento
  const [parametersDialogOpen, setParametersDialogOpen] = useState(false);
  const [budgetYear, setBudgetYear] = useState<number>(new Date().getFullYear() + 1);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [ipcaIndex, setIpcaIndex] = useState<string>("");
  const [calculatingBudget, setCalculatingBudget] = useState(false);
  const [clearingBudget, setClearingBudget] = useState(false);
  const [budgetForecasts, setBudgetForecasts] = useState<BudgetForecast[]>([]);

  const currentYear = new Date().getFullYear();

  // Funções de agregação e labels por período
  const aggregateValuesByViewType = (values: number[], viewType: ViewType, years: number[]): number[] => {
    if (years.length === 1) {
      // Single year
      if (viewType === 'month') return values;
      
      if (viewType === 'quarter') {
        return [
          values[0] + values[1] + values[2],
          values[3] + values[4] + values[5],
          values[6] + values[7] + values[8],
          values[9] + values[10] + values[11],
        ];
      }
      
      if (viewType === 'semester') {
        return [
          values.slice(0, 6).reduce((sum, v) => sum + v, 0),
          values.slice(6, 12).reduce((sum, v) => sum + v, 0),
        ];
      }
      
      if (viewType === 'year') {
        return [values.reduce((sum, v) => sum + v, 0)];
      }
    } else {
      // Multi-year: agregar cada ano separadamente
      const result: number[] = [];
      
      for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
        const yearValues = values.slice(yearIndex * 12, (yearIndex + 1) * 12);
        const aggregated = aggregateValuesByViewType(yearValues, viewType, [years[yearIndex]]);
        result.push(...aggregated);
      }
      
      return result;
    }
    
    return values;
  };

  const getColumnLabels = (viewType: ViewType, years: number[]): string[] => {
    const baseLabels = (() => {
      switch (viewType) {
        case 'month':
          return MONTH_NAMES;
        case 'quarter':
          return QUARTER_LABELS;
        case 'semester':
          return SEMESTER_LABELS;
        case 'year':
          return YEAR_LABEL;
      }
    })();

    if (years.length === 1) {
      return baseLabels;
    }

    // Multi-year: adiciona o ano a cada label
    return years.flatMap(year => baseLabels.map(label => `${label} ${year}`));
  };

  // Fetch available years from transactions
  const fetchAvailableYears = useCallback(async () => {
    const filterCompanyId = companyBranchFilter.selectedCompanyId || companyId;
    if (!filterCompanyId) return;

    try {
      // Build query for transactions
      let transactionsQuery = supabase
        .from("transaction_classifications")
        .select(`
          transaction_id,
          transactions!inner(
            transaction_date,
            company_id,
            branch_id
          )
        `)
        .eq("transactions.company_id", filterCompanyId)
        .not("transactions.transaction_date", "is", null)
        .gte("transactions.transaction_date", "2020-01-01");

      // Add branch filter if selected
      if (companyBranchFilter.selectedBranchId) {
        transactionsQuery = transactionsQuery.eq("transactions.branch_id", companyBranchFilter.selectedBranchId);
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;

      if (transactionsError) {
        throw transactionsError;
      }

      // Buscar anos de orçamento calculado
      const { data: forecastsData, error: forecastsError } = await supabase
        .from("budget_forecasts")
        .select("month_year")
        .eq("company_id", filterCompanyId)
        .not("month_year", "is", null)
        .order("month_year", { ascending: false });

      if (forecastsError) {
        throw forecastsError;
      }

      // Usar Set para extrair anos únicos de forma eficiente
      const yearsSet = new Set<number>();
      const transactionYears = new Set<number>();
      const forecastYears = new Set<number>();

      // Extrair anos únicos de transações classificadas
      if (transactionsData) {
        transactionsData.forEach((t) => {
          if (t.transactions?.transaction_date) {
            const year = parseInt(t.transactions.transaction_date.substring(0, 4), 10);
            if (!isNaN(year)) {
              transactionYears.add(year);
              yearsSet.add(year);
            }
          }
        });
      }

      // Extrair anos únicos de budget_forecasts
      if (forecastsData) {
        forecastsData.forEach((f) => {
          if (f.month_year) {
            const year = parseInt(f.month_year.substring(0, 4), 10);
            if (!isNaN(year)) {
              forecastYears.add(year);
              yearsSet.add(year);
            }
          }
        });
      }

      // Converter Set para Array e ordenar decrescente (mais recente primeiro)
      const yearsArray = Array.from(yearsSet).sort((a, b) => b - a);

      setAvailableYears(yearsArray);

      // Se os anos selecionados não estão na lista, selecionar o mais recente
      if (yearsArray.length > 0 && !selectedYears.some(year => yearsArray.includes(year))) {
        setSelectedYears([yearsArray[0]]);
      }
    } catch (error) {
      throw error;
    }
  }, [companyId, companyBranchFilter.selectedCompanyId, companyBranchFilter.selectedBranchId, selectedYears]);

  // Helper functions - defined early to avoid hoisting issues
  const getUnclassifiedCommitments = () => {
    const configuredCommitments = new Set(
      dreConfigurations.filter((config) => config.commitment_id).map((config) => config.commitment_id),
    );
    return commitments.filter((commitment) => !configuredCommitments.has(commitment.id));
  };

  const getAvailableGroups = () => {
    const unclassifiedCommitments = getUnclassifiedCommitments();
    const availableGroupIds = new Set(unclassifiedCommitments.map((c) => c.commitment_group_id));
    return groups.filter((group) => availableGroupIds.has(group.id));
  };

  const getCommitmentsForGroup = (groupId: string) => {
    return getUnclassifiedCommitments().filter((c) => c.commitment_group_id === groupId);
  };

  const getConfiguredCommitmentsForLine = (lineType: "revenue" | "cost" | "expense") => {
    return dreConfigurations
      .filter((config) => config.line_type === lineType && config.commitment_id)
      .map((config) => {
        const commitment = commitments.find((c) => c.id === config.commitment_id);
        const group = groups.find((g) => g.id === config.commitment_group_id);
        return {
          config,
          commitment: commitment?.name || "Desconhecido",
          group: group?.name || "Desconhecido",
          groupColor: group?.color || "#6B7280",
        };
      });
  };

  const handleAddCommitment = (lineType: "revenue" | "cost" | "expense") => {
    setSelectedLineType(lineType);
    setSelectedGroupId("");
    setSelectedCommitmentId("");
    setIsAddCommitmentDialogOpen(true);
  };

  const handleSaveCommitment = async () => {
    if (!selectedGroupId || !selectedCommitmentId) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione um grupo e uma natureza",
        variant: "destructive",
      });
      return;
    }
    await handleConfigurationSave(selectedLineType, selectedGroupId, selectedCommitmentId);
    setIsAddCommitmentDialogOpen(false);
  };

  // Função para carregar dados manualmente
  const handleLoadData = async () => {
    if (!companyId) return;
    if (selectedYears.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um ano",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const configs = await fetchConfigurations();
      
      if (selectedYears.length === 1) {
        // Single year mode
        await fetchTransactionData(configs);
      } else {
        // Multi-year mode
        await fetchMultiYearData(configs);
      }
      
      setHasLoadedData(true);
      
      toast({
        title: "Dados carregados",
        description: `Dados carregados para ${selectedYears.join(', ')}`,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do orçamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchAvailableYears();
    }

    // Setup real-time listeners (apenas para atualizar anos disponíveis)
    const transactionChannel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchAvailableYears();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budget_forecasts",
        },
        () => {
          fetchAvailableYears();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
    };
  }, [companyId, fetchAvailableYears]);

  const fetchTransactionData = async (configs: Configs) => {
    const filterCompanyId = companyBranchFilter.selectedCompanyId || companyId;
    if (!filterCompanyId) return;

    try {
      // Usar o primeiro ano selecionado (pode ser adaptado para múltiplos anos no futuro)
      const year = selectedYears[0] || new Date().getFullYear();
      const startDate = startOfYear(new Date(year, 0, 1));
      const endDate = endOfYear(new Date(year, 11, 31));

      // Build query with company and optional branch filter
      let transactionsQuery = supabase
        .from("transactions")
        .select("id, amount, transaction_date, transaction_type, description")
        .eq("company_id", filterCompanyId)
        .gte("transaction_date", format(startDate, "yyyy-MM-dd"))
        .lte("transaction_date", format(endDate, "yyyy-MM-dd"))
        .order("transaction_date", { ascending: true });

      // Add branch filter if selected
      if (companyBranchFilter.selectedBranchId) {
        transactionsQuery = transactionsQuery.eq("branch_id", companyBranchFilter.selectedBranchId);
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;

      if (transactionsError) {
        throw transactionsError;
      }

      // Buscar valores orçados (independente de haver transações)
      const forecasts = await fetchBudgetForecasts(year);
      setBudgetForecasts(forecasts);

      if (!transactionsData || transactionsData.length === 0) {
        setTransactions([]);
        processDataForDRE([], forecasts, configs, viewType);
        return;
      }

      // Get transaction IDs
      const transactionIds = transactionsData.map((t) => t.id);

      // Dividir transaction IDs em chunks para evitar erro "Bad Request"
      const transactionIdChunks: string[][] = [];
      for (let i = 0; i < transactionIds.length; i += CHUNK_SIZE) {
        transactionIdChunks.push(transactionIds.slice(i, i + CHUNK_SIZE));
      }

      // Buscar classificações em paralelo
      const classificationsPromises = transactionIdChunks.map((chunk) =>
        supabase
          .from("transaction_classifications")
          .select("transaction_id, commitment_id, commitment_group_id, commitment_type_id")
          .in("transaction_id", chunk),
      );

      const classificationsResults = await Promise.all(classificationsPromises);

      // Combinar todos os resultados
      const classificationsData: Array<{
        transaction_id: string;
        commitment_id: string | null;
        commitment_group_id: string | null;
        commitment_type_id: string | null;
      }> = [];

      for (const result of classificationsResults) {
        if (result.error) throw result.error;
        if (result.data) {
          classificationsData.push(...result.data);
        }
      }

      // Create a map of classifications by transaction_id
      const classificationsMap = new Map();

      classificationsData?.forEach((classification) => {
        let commitmentObj = null;

        if (classification.commitment_id) {
          // Buscar a natureza (commitment) nos dados carregados
          const commitment = configs.commitments.find((c) => c.id === classification.commitment_id);

          // Buscar o grupo usando o ID da classificação (não do commitment)
          const commitmentGroup = configs.groups.find((g) => g.id === classification.commitment_group_id);

          // Buscar o tipo usando o ID da classificação (não do commitment)
          const commitmentType = configs.commitmentTypes.find((ct) => ct.id === classification.commitment_type_id);

          commitmentObj = {
            id: commitment?.id || classification.commitment_id,
            name: commitment?.name || "Natureza Desconhecida",
            commitment_group: commitmentGroup
              ? {
                  id: commitmentGroup.id,
                  name: commitmentGroup.name,
                }
              : null,
            commitment_type: commitmentType
              ? {
                  id: commitmentType.id,
                  name: commitmentType.name,
                }
              : null,
          };
        }

        classificationsMap.set(classification.transaction_id, {
          commitment: commitmentObj,
          commitment_group: classification.commitment_group_id
            ? configs.groups.find((g) => g.id === classification.commitment_group_id)
            : null,
          commitment_type: classification.commitment_type_id
            ? configs.commitmentTypes.find((ct) => ct.id === classification.commitment_type_id)
            : null,
        });
      });

      // Combine transaction data with classifications
      const processedData = transactionsData.map((transaction) => ({
        ...transaction,
        classification: classificationsMap.get(transaction.id) || null,
      }));

      setTransactions(processedData);
      
      processDataForDRE(processedData, forecasts, configs, viewType);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigurations = async (): Promise<Configs> => {
    try {
      // Fetch DRE configurations
      const { data: configData, error: configError } = await supabase.from("dre_line_configurations").select("*");

      if (configError) throw configError;

      const dreConfigs =
        configData?.map((config) => ({
          ...config,
          line_type: config.line_type as "revenue" | "cost" | "expense",
        })) || [];

      setDreConfigurations(dreConfigs);

      // Fetch commitment groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("commitment_groups")
        .select("*")
        .eq("is_active", true);

      if (groupsError) throw groupsError;

      const grps = groupsData || [];
      setGroups(grps);

      // Fetch commitments
      const { data: commitmentsData, error: commitmentsError } = await supabase
        .from("commitments")
        .select("*")
        .eq("is_active", true);

      if (commitmentsError) throw commitmentsError;

      const cmts = commitmentsData || [];
      setCommitments(cmts);

      // Fetch commitment types
      const { data: commitmentTypesData, error: commitmentTypesError } = await supabase
        .from("commitment_types")
        .select("*")
        .eq("is_active", true);

      if (commitmentTypesError) throw commitmentTypesError;

      const ctypes = commitmentTypesData || [];
      setCommitmentTypes(ctypes);

      return {
        groups: grps,
        commitments: cmts,
        commitmentTypes: ctypes,
        dreConfigurations: dreConfigs,
      };
    } catch (error) {
      console.error("Error fetching configurations:", error);
      return {
        groups: [],
        commitments: [],
        commitmentTypes: [],
        dreConfigurations: [],
      };
    }
  };

  const fetchBudgetForecasts = async (year: number): Promise<BudgetForecast[]> => {
    const filterCompanyId = companyBranchFilter.selectedCompanyId || companyId;
    if (!filterCompanyId) return [];

    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const { data, error } = await supabase
        .from("budget_forecasts")
        .select("*")
        .eq("company_id", filterCompanyId)
        .gte("month_year", format(startDate, "yyyy-MM-dd"))
        .lte("month_year", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      return (data as BudgetForecast[]) || [];
    } catch (error) {
      throw error;
    }
  };

  const fetchMultiYearData = async (configs: Configs) => {
    const filterCompanyId = companyBranchFilter.selectedCompanyId || companyId;
    if (!filterCompanyId) return;

    try {
      // Buscar transações e forecasts de todos os anos em paralelo
      const dataPromises = selectedYears.map(async (year) => {
        const startDate = startOfYear(new Date(year, 0, 1));
        const endDate = endOfYear(new Date(year, 11, 31));

        // Build query with company and optional branch filter
        let transactionsQuery = supabase
          .from("transactions")
          .select("id, amount, transaction_date, transaction_type, description")
          .eq("company_id", filterCompanyId)
          .gte("transaction_date", format(startDate, "yyyy-MM-dd"))
          .lte("transaction_date", format(endDate, "yyyy-MM-dd"))
          .order("transaction_date", { ascending: true });

        // Add branch filter if selected
        if (companyBranchFilter.selectedBranchId) {
          transactionsQuery = transactionsQuery.eq("branch_id", companyBranchFilter.selectedBranchId);
        }

        const { data: transactionsData } = await transactionsQuery;

        // Buscar forecasts
        const forecasts = await fetchBudgetForecasts(year);

        return {
          year,
          transactions: transactionsData || [],
          forecasts,
        };
      });

      const allYearsData = await Promise.all(dataPromises);

      // Buscar classificações para todas as transações
      const allTransactionIds = allYearsData.flatMap(d => d.transactions.map(t => t.id));
      
      const transactionIdChunks: string[][] = [];
      for (let i = 0; i < allTransactionIds.length; i += CHUNK_SIZE) {
        transactionIdChunks.push(allTransactionIds.slice(i, i + CHUNK_SIZE));
      }
      const classificationsPromises = transactionIdChunks.map((chunk) =>
        supabase
          .from("transaction_classifications")
          .select("transaction_id, commitment_id, commitment_group_id, commitment_type_id")
          .in("transaction_id", chunk)
      );

      const classificationsResults = await Promise.all(classificationsPromises);
      const classificationsData: Array<{
        transaction_id: string;
        commitment_id: string | null;
        commitment_group_id: string | null;
        commitment_type_id: string | null;
      }> = [];
      classificationsResults.forEach(result => {
        if (result.error) throw result.error;
        if (result.data) {
          classificationsData.push(...result.data);
        }
      });

      // Criar mapa de classificações
      const classificationsMap = new Map();
      classificationsData.forEach((classification) => {
        if (classification.commitment_id) {
          const commitment = configs.commitments.find((c) => c.id === classification.commitment_id);
          const commitmentGroup = configs.groups.find((g) => g.id === classification.commitment_group_id);
          const commitmentType = configs.commitmentTypes.find((ct) => ct.id === classification.commitment_type_id);

          classificationsMap.set(classification.transaction_id, {
            commitment: commitment ? {
              id: commitment.id,
              name: commitment.name,
              commitment_group: commitmentGroup ? { id: commitmentGroup.id, name: commitmentGroup.name } : null,
              commitment_type: commitmentType ? { id: commitmentType.id, name: commitmentType.name } : null,
            } : null,
            commitment_group: commitmentGroup,
            commitment_type: commitmentType,
          });
        }
      });

      // Processar dados de cada ano
      const processedYears = allYearsData.map(yearData => ({
        year: yearData.year,
        transactions: yearData.transactions.map(t => ({
          ...t,
          classification: classificationsMap.get(t.id) || null,
        })),
        forecasts: yearData.forecasts,
      }));

      processMultiYearBudgetData(processedYears, configs);
    } catch (error) {
      throw error;
    }
  };

  const processMultiYearBudgetData = (
    yearsData: Array<{ year: number; transactions: TransactionData[]; forecasts: BudgetForecast[] }>,
    configs: Configs
  ) => {
    const numPeriods = viewType === 'month' ? 12 : viewType === 'quarter' ? 4 : viewType === 'semester' ? 2 : 1;
    const totalPeriods = numPeriods * yearsData.length;

    // Criar hierarquia combinada
    const hierarchyMap = new Map<
      string,
      {
        type: CommitmentType;
        groups: Map<string, {
          group: CommitmentGroup;
          commitments: Map<string, {
            commitment: Commitment;
            values: number[];
            budgetedValues: number[];
          }>;
          values: number[];
          budgetedValues: number[];
        }>;
        values: number[];
        budgetedValues: number[];
      }
    >();

    // Processar cada ano
    yearsData.forEach((yearData, yearIndex) => {
      const yearOffset = yearIndex * 12; // Sempre 12 meses por ano antes de agregar

      // Processar transações do ano
      yearData.transactions.forEach((transaction) => {
        const classification = transaction.classification;
        if (!classification || !classification.commitment) return;

        const monthIndex = parseISO(transaction.transaction_date).getMonth();
        const amount = transaction.transaction_type === "credit" ? Math.abs(transaction.amount) : -Math.abs(transaction.amount);

        const commitmentId = classification.commitment.id;
        const commitmentName = classification.commitment.name;
        const commitmentGroupId = classification.commitment_group?.id || "unknown";
        const commitmentGroupName = classification.commitment_group?.name || "Grupo Desconhecido";
        const commitmentTypeId = classification.commitment_type?.id || "unknown";
        const commitmentTypeName = classification.commitment_type?.name || "Tipo Desconhecido";

        // Inicializar hierarquia
        if (!hierarchyMap.has(commitmentTypeId)) {
          hierarchyMap.set(commitmentTypeId, {
            type: { id: commitmentTypeId, name: commitmentTypeName, company_id: "" },
            groups: new Map(),
            values: new Array(12 * yearsData.length).fill(0),
            budgetedValues: new Array(12 * yearsData.length).fill(0),
          });
        }
        const typeData = hierarchyMap.get(commitmentTypeId)!;
        typeData.values[yearOffset + monthIndex] += amount;

        if (!typeData.groups.has(commitmentGroupId)) {
          typeData.groups.set(commitmentGroupId, {
            group: { id: commitmentGroupId, name: commitmentGroupName, color: "#6B7280", company_id: "" },
            commitments: new Map(),
            values: new Array(12 * yearsData.length).fill(0),
            budgetedValues: new Array(12 * yearsData.length).fill(0),
          });
        }
        const groupData = typeData.groups.get(commitmentGroupId)!;
        groupData.values[yearOffset + monthIndex] += amount;

        if (!groupData.commitments.has(commitmentId)) {
          groupData.commitments.set(commitmentId, {
            commitment: { id: commitmentId, name: commitmentName, commitment_group_id: commitmentGroupId },
            values: new Array(12 * yearsData.length).fill(0),
            budgetedValues: new Array(12 * yearsData.length).fill(0),
          });
        }
        const commitmentData = groupData.commitments.get(commitmentId)!;
        commitmentData.values[yearOffset + monthIndex] += amount;
      });

      // Processar forecasts do ano
      yearData.forecasts.forEach((forecast) => {
        if (!forecast.commitment_type_id) return;

        const monthIndex = parseInt(forecast.month_year.split('-')[1], 10) - 1;
        const budgetedAmount = forecast.budgeted_amount || 0;

        const commitmentTypeId = forecast.commitment_type_id;
        const commitmentGroupId = forecast.commitment_group_id;
        const commitmentId = forecast.commitment_id;

        if (!hierarchyMap.has(commitmentTypeId)) {
          const typeInfo = configs.commitmentTypes.find(t => t.id === commitmentTypeId);
          if (typeInfo) {
            hierarchyMap.set(commitmentTypeId, {
              type: typeInfo,
              groups: new Map(),
              values: new Array(12 * yearsData.length).fill(0),
              budgetedValues: new Array(12 * yearsData.length).fill(0),
            });
          }
        }

        const typeData = hierarchyMap.get(commitmentTypeId);
        if (!typeData) return;

        if (commitmentId && commitmentGroupId) {
          if (!typeData.groups.has(commitmentGroupId)) {
            const groupInfo = configs.groups.find(g => g.id === commitmentGroupId);
            if (groupInfo) {
              typeData.groups.set(commitmentGroupId, {
                group: groupInfo,
                commitments: new Map(),
                values: new Array(12 * yearsData.length).fill(0),
                budgetedValues: new Array(12 * yearsData.length).fill(0),
              });
            }
          }

          const groupData = typeData.groups.get(commitmentGroupId);
          if (groupData) {
            if (!groupData.commitments.has(commitmentId)) {
              const commitmentInfo = configs.commitments.find(c => c.id === commitmentId);
              if (commitmentInfo) {
                groupData.commitments.set(commitmentId, {
                  commitment: commitmentInfo,
                  values: new Array(12 * yearsData.length).fill(0),
                  budgetedValues: new Array(12 * yearsData.length).fill(0),
                });
              }
            }

            const commitmentData = groupData.commitments.get(commitmentId);
            if (commitmentData) {
              commitmentData.budgetedValues[yearOffset + monthIndex] += budgetedAmount;
              groupData.budgetedValues[yearOffset + monthIndex] += budgetedAmount;
              typeData.budgetedValues[yearOffset + monthIndex] += budgetedAmount;
            }
          }
        } else if (commitmentGroupId) {
          if (!typeData.groups.has(commitmentGroupId)) {
            const groupInfo = configs.groups.find(g => g.id === commitmentGroupId);
            if (groupInfo) {
              typeData.groups.set(commitmentGroupId, {
                group: groupInfo,
                commitments: new Map(),
                values: new Array(12 * yearsData.length).fill(0),
                budgetedValues: new Array(12 * yearsData.length).fill(0),
              });
            }
          }

          const groupData = typeData.groups.get(commitmentGroupId);
          if (groupData) {
            groupData.budgetedValues[yearOffset + monthIndex] += budgetedAmount;
            typeData.budgetedValues[yearOffset + monthIndex] += budgetedAmount;
          }
        } else {
          typeData.budgetedValues[yearOffset + monthIndex] += budgetedAmount;
        }
      });
    });

    // Criar linhas DRE
    const lines: DRELine[] = [];

    hierarchyMap.forEach((typeData, typeId) => {
      lines.push({
        id: `type-${typeId}`,
        label: typeData.type.name,
        type: "commitment_type",
        level: 0,
        values: aggregateValuesByViewType(typeData.values, viewType, selectedYears),
        budgetedValues: aggregateValuesByViewType(typeData.budgetedValues, viewType, selectedYears),
        expandable: typeData.groups.size > 0,
        expanded: false,
        itemId: typeId,
      });

      typeData.groups.forEach((groupData, groupId) => {
        lines.push({
          id: `group-${groupId}`,
          label: `  ${groupData.group.name}`,
          type: "commitment_group",
          level: 1,
          values: aggregateValuesByViewType(groupData.values, viewType, selectedYears),
          budgetedValues: aggregateValuesByViewType(groupData.budgetedValues, viewType, selectedYears),
          expandable: groupData.commitments.size > 0,
          expanded: false,
          parentId: `type-${typeId}`,
          itemId: groupId,
        });

        groupData.commitments.forEach((commitmentData, commitmentId) => {
          lines.push({
            id: `commitment-${commitmentId}`,
            label: `    ${commitmentData.commitment.name}`,
            type: "commitment",
            level: 2,
            values: aggregateValuesByViewType(commitmentData.values, viewType, selectedYears),
            budgetedValues: aggregateValuesByViewType(commitmentData.budgetedValues, viewType, selectedYears),
            expandable: false,
            parentId: `group-${groupId}`,
            itemId: commitmentId,
          });
        });
      });
    });

    setDreLines(lines);
  };

  const processDataForDRE = (transactions: TransactionData[], budgetForecasts: any[] = [], configs: Configs, viewType: ViewType) => {
    // Create hierarchical data structure based on commitment types → groups → commitments
    const hierarchyMap = new Map<
      string,
      {
        type: CommitmentType;
        groups: Map<
          string,
          {
            group: CommitmentGroup;
            commitments: Map<
              string,
              {
                commitment: Commitment;
                values: number[];
                budgetedValues: number[];
              }
            >;
            values: number[];
            budgetedValues: number[];
          }
        >;
        values: number[];
        budgetedValues: number[];
      }
    >();

    // Flag para log único
    let hasLoggedSample = false;

    // Process each transaction
    transactions.forEach((transaction) => {
      const monthIndex = parseISO(transaction.transaction_date).getMonth();
      // Apply debit/credit logic: credits are positive, debits are negative
      const amount =
        transaction.transaction_type === "credit" ? Math.abs(transaction.amount) : -Math.abs(transaction.amount);

      // Extract hierarchy information from classification
      const classification = transaction.classification;

      // Filter: Only show fully classified transactions in Budget view
      if (!classification || !classification.commitment) {
        return; // Skip unclassified or partially classified transactions
      }

      // Log para debug - primeira transação classificada
      if (!hasLoggedSample) {
        console.log('✅ Transação classificada (sample):', {
          date: transaction.transaction_date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.transaction_type,
          commitment: classification.commitment.name,
          group: classification.commitment_group?.name,
          commitmentType: classification.commitment_type?.name
        });
        hasLoggedSample = true;
      }

      // Full classification with commitment
      const commitmentId = classification.commitment.id || "unknown";
      const commitmentName = classification.commitment.name;
      const commitmentGroupId = classification.commitment_group?.id || "unknown";
      const commitmentGroupName = classification.commitment_group?.name || "Grupo Desconhecido";
      const commitmentTypeId = classification.commitment_type?.id || "unknown";
      const commitmentTypeName = classification.commitment_type?.name || "Tipo Desconhecido";

      // Initialize type if not exists
      if (!hierarchyMap.has(commitmentTypeId)) {
        hierarchyMap.set(commitmentTypeId, {
          type: {
            id: commitmentTypeId,
            name: commitmentTypeName,
            company_id: "",
          },
          groups: new Map(),
          values: new Array(12).fill(0),
          budgetedValues: new Array(12).fill(0),
        });
      }
      const typeData = hierarchyMap.get(commitmentTypeId)!;
      typeData.values[monthIndex] += amount;

      // Initialize group if not exists
      if (!typeData.groups.has(commitmentGroupId)) {
        typeData.groups.set(commitmentGroupId, {
          group: {
            id: commitmentGroupId,
            name: commitmentGroupName,
            color: "#6B7280",
            company_id: "",
          },
          commitments: new Map(),
          values: new Array(12).fill(0),
          budgetedValues: new Array(12).fill(0),
        });
      }
      const groupData = typeData.groups.get(commitmentGroupId)!;
      groupData.values[monthIndex] += amount;

      // Initialize commitment if not exists
      if (!groupData.commitments.has(commitmentId)) {
        groupData.commitments.set(commitmentId, {
          commitment: {
            id: commitmentId,
            name: commitmentName,
            commitment_group_id: commitmentGroupId,
          },
          values: new Array(12).fill(0),
          budgetedValues: new Array(12).fill(0),
        });
      }
      const commitmentData = groupData.commitments.get(commitmentId)!;
      commitmentData.values[monthIndex] += amount;
    });

    // Log final de processamento
    console.log('📊 Processamento concluído:', {
      totalTransacoesProcessadas: transactions.filter(t => 
        t.classification && t.classification.commitment
      ).length,
      totalTransacoesIgnoradas: transactions.filter(t => 
        !t.classification || !t.classification.commitment
      ).length,
      hierarquiasEncontradas: hierarchyMap.size
    });

    // Process budget forecasts to populate budgetedValues
    console.log(`📊 Processing ${budgetForecasts.length} budget forecasts...`);
    
    budgetForecasts.forEach((forecast) => {
      // Processar apenas registros com commitment_type_id
      if (!forecast.commitment_type_id) {
        return;
      }
      
      // Extrair o mês do month_year (0-11) diretamente da string ISO para evitar problemas de timezone
      const monthIndex = parseInt(forecast.month_year.split('-')[1]) - 1;
      const budgetedAmount = parseFloat(forecast.budgeted_amount) || 0;
      
      // Identificar a hierarquia completa
      const commitmentTypeId = forecast.commitment_type_id;
      const commitmentGroupId = forecast.commitment_group_id;
      const commitmentId = forecast.commitment_id;
      
      // Log de debug para primeira forecast
      if (!hasLoggedSample) {
        console.log('📋 Sample forecast:', {
          month_year: forecast.month_year,
          monthIndex,
          budgeted_amount: budgetedAmount,
          commitment_type_id: commitmentTypeId,
          commitment_group_id: commitmentGroupId,
          commitment_id: commitmentId,
        });
        hasLoggedSample = true;
      }
      
      // Criar hierarquia se não existir
      if (!hierarchyMap.has(commitmentTypeId)) {
        const typeInfo = configs.commitmentTypes.find(t => t.id === commitmentTypeId);
        if (typeInfo) {
          hierarchyMap.set(commitmentTypeId, {
            type: typeInfo,
            groups: new Map(),
            values: new Array(12).fill(0),
            budgetedValues: new Array(12).fill(0),
          });
        }
      }
      
      const typeData = hierarchyMap.get(commitmentTypeId);
      if (!typeData) return;
      
      // Processar no nível mais específico disponível
      if (commitmentId) {
        // Tem commitment_id - processar no nível de commitment
        if (commitmentGroupId) {
          // Criar grupo se não existir
          if (!typeData.groups.has(commitmentGroupId)) {
            const groupInfo = configs.groups.find(g => g.id === commitmentGroupId);
            if (groupInfo) {
              typeData.groups.set(commitmentGroupId, {
                group: groupInfo,
                commitments: new Map(),
                values: new Array(12).fill(0),
                budgetedValues: new Array(12).fill(0),
              });
            }
          }
          
          const groupData = typeData.groups.get(commitmentGroupId);
          if (groupData) {
            // Criar commitment se não existir
            if (!groupData.commitments.has(commitmentId)) {
              const commitmentInfo = configs.commitments.find(c => c.id === commitmentId);
              if (commitmentInfo) {
                groupData.commitments.set(commitmentId, {
                  commitment: commitmentInfo,
                  values: new Array(12).fill(0),
                  budgetedValues: new Array(12).fill(0),
                });
              }
            }
            
            // Adicionar apenas no commitment (nível mais específico)
            const commitmentData = groupData.commitments.get(commitmentId);
            if (commitmentData) {
              commitmentData.budgetedValues[monthIndex] += budgetedAmount;
              // Propagar para os níveis superiores
              groupData.budgetedValues[monthIndex] += budgetedAmount;
              typeData.budgetedValues[monthIndex] += budgetedAmount;
            }
          }
        }
      } else if (commitmentGroupId) {
        // Tem apenas group_id - processar no nível de grupo
        if (!typeData.groups.has(commitmentGroupId)) {
          const groupInfo = configs.groups.find(g => g.id === commitmentGroupId);
          if (groupInfo) {
            typeData.groups.set(commitmentGroupId, {
              group: groupInfo,
              commitments: new Map(),
              values: new Array(12).fill(0),
              budgetedValues: new Array(12).fill(0),
            });
          }
        }
        
        const groupData = typeData.groups.get(commitmentGroupId);
        if (groupData) {
          // Adicionar apenas no grupo
          groupData.budgetedValues[monthIndex] += budgetedAmount;
          // Propagar para o tipo
          typeData.budgetedValues[monthIndex] += budgetedAmount;
        }
      } else {
        // Tem apenas type_id - processar no nível de tipo
        typeData.budgetedValues[monthIndex] += budgetedAmount;
      }
    });

    // Create hierarchical DRE structure
    const lines: DRELine[] = [];

    // Build the hierarchical lines
    hierarchyMap.forEach((typeData, typeId) => {
      // Add commitment type line
      lines.push({
        id: `type-${typeId}`,
        label: typeData.type.name,
        type: "commitment_type",
        level: 0,
        values: aggregateValuesByViewType(typeData.values, viewType, selectedYears),
        budgetedValues: aggregateValuesByViewType(typeData.budgetedValues || new Array(12).fill(0), viewType, selectedYears),
        expandable: typeData.groups.size > 0,
        expanded: false,
        itemId: typeId,
      });

      // Log de debug
      console.log(`📋 ${typeData.type.name}:`, {
        jan: typeData.values[0],
        fev: typeData.values[1],
        total: typeData.values.reduce((a, b) => a + b, 0)
      });

      // Add commitment groups
      typeData.groups.forEach((groupData, groupId) => {
        lines.push({
          id: `group-${groupId}`,
          label: `  ${groupData.group.name}`,
          type: "commitment_group",
          level: 1,
          values: aggregateValuesByViewType(groupData.values, viewType, selectedYears),
          budgetedValues: aggregateValuesByViewType(groupData.budgetedValues || new Array(12).fill(0), viewType, selectedYears),
          expandable: groupData.commitments.size > 0,
          expanded: false,
          parentId: `type-${typeId}`,
          itemId: groupId,
        });

        // Add commitments
        groupData.commitments.forEach((commitmentData, commitmentId) => {
          lines.push({
            id: `commitment-${commitmentId}`,
            label: `    ${commitmentData.commitment.name}`,
            type: "commitment",
            level: 2,
            values: aggregateValuesByViewType(commitmentData.values, viewType, selectedYears),
            budgetedValues: aggregateValuesByViewType(commitmentData.budgetedValues || new Array(12).fill(0), viewType, selectedYears),
            expandable: false,
            parentId: `group-${groupId}`,
            itemId: commitmentId,
          });
        });
      });
    });

    // Popular valores orçados de budget_forecasts
    lines.forEach((line) => {
      if (line.type === "commitment_type" && line.itemId) {
        // Buscar forecasts para este tipo (sem grupo e sem commitment)
        const typeForecasts = budgetForecasts.filter(
          (bf) => bf.commitment_type_id === line.itemId && !bf.commitment_group_id && !bf.commitment_id
        );
        
        typeForecasts.forEach((bf) => {
          const monthIndex = new Date(bf.month_year).getMonth();
          line.budgetedValues[monthIndex] = parseFloat(bf.budgeted_amount || 0);
        });
      } else if (line.type === "commitment_group" && line.itemId) {
        // Buscar forecasts para este grupo (sem commitment)
        const groupForecasts = budgetForecasts.filter(
          (bf) => bf.commitment_group_id === line.itemId && !bf.commitment_id
        );
        
        groupForecasts.forEach((bf) => {
          const monthIndex = new Date(bf.month_year).getMonth();
          line.budgetedValues[monthIndex] = parseFloat(bf.budgeted_amount || 0);
        });
      } else if (line.type === "commitment" && line.itemId) {
        // Buscar forecasts para esta natureza
        const commitmentForecasts = budgetForecasts.filter(
          (bf) => bf.commitment_id === line.itemId
        );
        
        commitmentForecasts.forEach((bf) => {
          const monthIndex = new Date(bf.month_year).getMonth();
          line.budgetedValues[monthIndex] = parseFloat(bf.budgeted_amount || 0);
        });
      }
    });

    setDreLines(lines);
  };


  const toggleLineExpansion = (lineId: string) => {
    setExpandedLines((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lineId)) {
        newSet.delete(lineId);
      } else {
        newSet.add(lineId);
      }
      return newSet;
    });
  };

  const isLineVisible = (line: DRELine): boolean => {
    if (line.level === 0) return true;
    if (!line.parentId) return true;
    const parentExpanded = expandedLines.has(line.parentId);
    if (!parentExpanded) return false;

    // Check if all parent levels are expanded
    const parentLine = dreLines.find((l) => l.id === line.parentId);
    if (parentLine && parentLine.level > 0) {
      return isLineVisible(parentLine);
    }
    return true;
  };

  const getRowClassName = (type: string, level: number) => {
    let baseClass = "";
    switch (type) {
      case "commitment_type":
        baseClass = level === 0 ? "bg-primary/5 font-bold border-t border-primary/20" : "";
        break;
      case "commitment_group":
        baseClass = "text-card-foreground font-medium bg-secondary/10";
        break;
      case "commitment":
        baseClass = "text-card-foreground";
        break;
      case "unclassified":
        baseClass = "text-card-foreground font-medium bg-warning/10 dark:bg-warning/20";
        break;
      default:
        baseClass = "";
    }
    if (level > 0) {
      baseClass += " hover:bg-secondary/20 transition-colors";
    }
    return baseClass;
  };

  const handleConfigurationSave = async (
    lineType: "revenue" | "cost" | "expense",
    groupId: string,
    commitmentId?: string,
  ) => {
    try {
      setConfigLoading(true);

      // First, remove any existing configuration for this group/commitment
      if (commitmentId) {
        await supabase
          .from("dre_line_configurations")
          .delete()
          .eq("commitment_group_id", groupId)
          .eq("commitment_id", commitmentId);
      } else {
        await supabase
          .from("dre_line_configurations")
          .delete()
          .eq("commitment_group_id", groupId)
          .is("commitment_id", null);
      }

      // Insert new configuration
      // Get company_id from the first available group since all groups belong to companies
      const selectedGroup = groups.find((g) => g.id === groupId);
      const companyId = selectedGroup?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { error } = await supabase.from("dre_line_configurations").insert({
        line_type: lineType,
        commitment_group_id: groupId,
        commitment_id: commitmentId || null,
        company_id: companyId,
      });

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "A configuração da DRE foi atualizada com sucesso",
      });

      const config = await fetchConfigurations();
      await fetchTransactionData(config); // Refresh data to apply new configuration
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleCalculateBudget = async () => {
    const filterCompanyId = companyBranchFilter.selectedCompanyId || companyId;
    if (!filterCompanyId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive",
      });
      return;
    }

    if (selectedMonths.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um mês",
        variant: "destructive",
      });
      return;
    }

    try {
      setCalculatingBudget(true);

      // Validar IPCA
      const ipca = parseFloat(ipcaIndex);
      if (isNaN(ipca)) {
        throw new Error("Índice IPCA inválido");
      }

      const multiplier = 1 + ipca / 100;
      const targetYear = budgetYear;
      const previousYear = targetYear - 1;

      console.log(`📊 Calculando orçamento para ${targetYear} usando base de ${previousYear}`);
      console.log(`📊 Meses selecionados:`, selectedMonths.map(m => `${m.toString().padStart(2, '0')}`).join(', '));
      console.log(`📊 Multiplicador IPCA: ${multiplier}`);

      // Build query with company and optional branch filter
      let transactionsQuery = supabase
        .from("transactions")
        .select(`
          id,
          amount,
          transaction_date,
          transaction_type,
          description,
          transaction_classifications (
            commitment_type_id,
            commitment_group_id,
            commitment_id
          )
        `)
        .eq("company_id", filterCompanyId)
        .gte("transaction_date", `${previousYear}-01-01`)
        .lte("transaction_date", `${previousYear}-12-31`);

      // Add branch filter if selected
      if (companyBranchFilter.selectedBranchId) {
        transactionsQuery = transactionsQuery.eq("branch_id", companyBranchFilter.selectedBranchId);
      }

      const { data: previousYearTransactions, error: transError } = await transactionsQuery;

      if (transError) throw transError;

      // Estrutura para armazenar valores realizados por mês - agrupando por commitment completo
      const realizedByMonth = new Map<string, Map<string, {
        commitment_type_id: string,
        commitment_group_id: string | null,
        commitment_id: string | null,
        value: number
      }>>();

      // Inicializar estrutura para cada mês selecionado
      selectedMonths.forEach(monthNum => {
        const monthKey = monthNum.toString().padStart(2, '0');
        realizedByMonth.set(monthKey, new Map());
      });

      // Processar transações do ano anterior - agrupando por commitment completo
      previousYearTransactions?.forEach((transaction) => {
        const transactionDate = new Date(transaction.transaction_date + 'T12:00:00');
        const monthNum = transactionDate.getMonth() + 1; // 1-12
        const monthKey = monthNum.toString().padStart(2, '0');

        // Só processar se o mês estiver na lista selecionada
        if (!selectedMonths.includes(monthNum)) return;

        const amount = Math.abs(parseFloat(transaction.amount.toString()));
        const isInflow = transaction.transaction_type === "credit";
        const value = isInflow ? amount : -amount;

        const monthData = realizedByMonth.get(monthKey);
        if (!monthData) return;

        const classification = transaction.transaction_classifications;

        // Apenas processar se tiver pelo menos commitment_type_id
        if (classification?.commitment_type_id) {
          // Criar chave única baseada na hierarquia completa
          const key = `${classification.commitment_type_id}_${classification.commitment_group_id || 'null'}_${classification.commitment_id || 'null'}`;
          
          const existing = monthData.get(key);
          if (existing) {
            existing.value += value;
          } else {
            monthData.set(key, {
              commitment_type_id: classification.commitment_type_id,
              commitment_group_id: classification.commitment_group_id,
              commitment_id: classification.commitment_id,
              value: value
            });
          }
        }
      });

      // Análise: detectar quais meses tiveram transações classificadas
      const monthsWithData: number[] = [];
      const monthsWithoutData: number[] = [];
      
      selectedMonths.forEach(monthNum => {
        const monthKey = monthNum.toString().padStart(2, '0');
        const monthData = realizedByMonth.get(monthKey);
        
        const hasData = monthData && monthData.size > 0;
        
        if (hasData) {
          monthsWithData.push(monthNum);
        } else {
          monthsWithoutData.push(monthNum);
        }
      });

      // Gerar budget forecasts
      const budgetForecastsToInsert: Array<{
        company_id: string;
        commitment_type_id: string;
        commitment_group_id: string | null;
        commitment_id: string | null;
        month_year: string;
        budgeted_amount: number;
        historical_average_12m: number;
        is_locked: boolean;
        calculation_date: string;
      }> = [];

      selectedMonths.forEach(monthNum => {
        const monthStr = monthNum.toString().padStart(2, '0');
        const targetMonthDate = `${targetYear}-${monthStr}-01`;
        const monthData = realizedByMonth.get(monthStr);

        if (!monthData) return;

        // Criar um registro por commitment completo com toda a hierarquia
        monthData.forEach((item) => {
          const orcado = item.value * multiplier;
          budgetForecastsToInsert.push({
            company_id: filterCompanyId,
            commitment_type_id: item.commitment_type_id,
            commitment_group_id: item.commitment_group_id,
            commitment_id: item.commitment_id,
            month_year: targetMonthDate,
            budgeted_amount: orcado,
            historical_average_12m: item.value,
            is_locked: false,
            calculation_date: new Date().toISOString()
          });
        });
      });

      if (budgetForecastsToInsert.length === 0) {
        const monthsRequested = selectedMonths.map(m => MONTHS_SHORT[m-1]).join(', ');
        
        toast({
          title: "Nenhum orçamento foi gerado",
          description: `Não há transações classificadas em ${previousYear} para os meses: ${monthsRequested}. Classifique as transações de ${previousYear} primeiro.`,
          variant: "destructive"
        });
        
        setCalculatingBudget(false);
        return;
      }

      // Deletar orçamentos antigos dos meses selecionados
      for (const monthNum of selectedMonths) {
        const monthStr = monthNum.toString().padStart(2, '0');
        const targetMonthDate = `${targetYear}-${monthStr}-01`;
        
        const { error: deleteError } = await supabase
          .from("budget_forecasts")
          .delete()
          .eq("company_id", filterCompanyId)
          .eq("month_year", targetMonthDate);

        if (deleteError) throw deleteError;
      }

      // Inserir novos orçamentos
      if (budgetForecastsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("budget_forecasts")
          .insert(budgetForecastsToInsert);

        if (insertError) {
          throw new Error(`Falha ao salvar orçamento: ${insertError.message}`);
        }
      }

      // Aguardar commit no banco antes de buscar anos atualizados
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recalcular quais meses realmente tiveram orçamento gerado
      const monthsWithBudget = new Set<number>();
      budgetForecastsToInsert.forEach(forecast => {
        const monthMatch = forecast.month_year.match(/-(\d{2})-/);
        if (monthMatch) {
          monthsWithBudget.add(parseInt(monthMatch[1], 10));
        }
      });

      const generatedMonthsArray = Array.from(monthsWithBudget).sort((a, b) => a - b);
      const generatedMonthsNames = generatedMonthsArray.map(m => MONTHS_SHORT[m-1]).join(', ');
      
      const missingMonths = selectedMonths.filter(m => !monthsWithBudget.has(m));
      const missingMonthsNames = missingMonths.map(m => MONTHS_SHORT[m-1]).join(', ');

      // Atualizar tabela
      const configs = await fetchConfigurations();
      await fetchTransactionData(configs);
      await fetchAvailableYears();
      setParametersDialogOpen(false);

      // Mensagem de sucesso mais informativa
      if (missingMonths.length === 0) {
        toast({
          title: "Orçamento calculado com sucesso!",
          description: `${budgetForecastsToInsert.length} registros salvos para ${generatedMonthsNames} de ${targetYear}.`,
        });
      } else {
        toast({
          title: "Orçamento calculado parcialmente",
          description: `✅ Gerado: ${generatedMonthsNames}${missingMonthsNames ? `\n⚠️ Sem base de cálculo em ${previousYear}: ${missingMonthsNames}` : ''}`,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível calcular o orçamento";
      toast({
        title: "Erro ao calcular orçamento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCalculatingBudget(false);
    }
  };

  const handleClearBudget = async () => {
    const filterCompanyId = companyBranchFilter.selectedCompanyId || companyId;
    if (!filterCompanyId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive",
      });
      return;
    }

    if (selectedMonths.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um mês",
        variant: "destructive",
      });
      return;
    }

    try {
      setClearingBudget(true);

      // Deletar orçamento dos meses selecionados
      for (const monthNum of selectedMonths) {
        const monthStr = monthNum.toString().padStart(2, '0');
        const targetMonthDate = `${budgetYear}-${monthStr}-01`;
        
        const { error: deleteError } = await supabase
          .from("budget_forecasts")
          .delete()
          .eq("company_id", filterCompanyId)
          .eq("month_year", targetMonthDate);

        if (deleteError) throw deleteError;
      }

      const configs = await fetchConfigurations();
      await fetchTransactionData(configs);
      await fetchAvailableYears();
      setParametersDialogOpen(false);
      toast({
        title: "Orçamento limpo",
        description: `Orçamento limpo para ${selectedMonths.length} mês(es) de ${budgetYear}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível limpar o orçamento";
      toast({
        title: "Erro ao limpar orçamento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setClearingBudget(false);
    }
  };

  const handleConfigurationRemove = async (groupId: string, commitmentId?: string) => {
    try {
      setConfigLoading(true);
      let query = supabase.from("dre_line_configurations").delete().eq("commitment_group_id", groupId);
      if (commitmentId) {
        query = query.eq("commitment_id", commitmentId);
      } else {
        query = query.is("commitment_id", null);
      }
      const { error } = await query;
      if (error) throw error;

      toast({
        title: "Configuração removida",
        description: "A configuração foi removida com sucesso",
      });

      const config = await fetchConfigurations();
      await fetchTransactionData(config); // Refresh data to apply changes
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a configuração",
        variant: "destructive",
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const getConfigurationForItem = (groupId: string, commitmentId?: string) => {
    return dreConfigurations.find(
      (c) => c.commitment_group_id === groupId && (commitmentId ? c.commitment_id === commitmentId : !c.commitment_id),
    );
  };

  const getLineTypeLabel = (type: LineType) => {
    switch (type) {
      case "revenue":
        return "Receita";
      case "cost":
        return "Custo";
      case "expense":
        return "Despesa";
    }
  };

  const getLineTypeColor = (type: LineType) => {
    switch (type) {
      case "revenue":
        return "bg-green-100 text-green-800 border-green-200";
      case "cost":
        return "bg-red-100 text-red-800 border-red-200";
      case "expense":
        return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  const monthlyTotals = useMemo(() => {
    if (selectedYears.length === 1) {
      const totals = new Array(12).fill(0);
      dreLines.forEach((l) => {
        if (l.level === 0) {
          l.values.forEach((v, i) => {
            totals[i] += v;
          });
        }
      });
      return aggregateValuesByViewType(totals, viewType, selectedYears);
    } else {
      // Multi-year: totals já vêm agregados
      const numPeriods = viewType === 'month' ? 12 : viewType === 'quarter' ? 4 : viewType === 'semester' ? 2 : 1;
      const totalPeriods = numPeriods * selectedYears.length;
      const totals = new Array(totalPeriods).fill(0);
      dreLines.forEach((l) => {
        if (l.level === 0) {
          l.values.forEach((v, i) => {
            totals[i] += v;
          });
        }
      });
      return totals;
    }
  }, [dreLines, viewType, selectedYears]);

  const columnLabels = useMemo(() => getColumnLabels(viewType, selectedYears), [viewType, selectedYears]);

  const grandTotal = useMemo(() => monthlyTotals.reduce((acc, v) => acc + v, 0), [monthlyTotals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <CompanyBranchFilter
          companies={companyBranchFilter.companies}
          branches={companyBranchFilter.branches}
          selectedCompanyId={companyBranchFilter.selectedCompanyId}
          selectedBranchId={companyBranchFilter.selectedBranchId}
          onCompanyChange={companyBranchFilter.handleCompanyChange}
          onBranchChange={companyBranchFilter.handleBranchChange}
          loading={companyBranchFilter.loading}
        />
      </div>

      <BudgetToolbar
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        availableYears={availableYears}
        viewType={viewType}
        onViewTypeChange={setViewType}
        onLoadData={handleLoadData}
        isLoading={loading}
      />

      {!hasLoadedData && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado carregado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Selecione o(s) ano(s) e clique em "Carregar" para visualizar os dados do orçamento.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Carregando dados do orçamento...</p>
          </CardContent>
        </Card>
      )}

      {hasLoadedData && !loading && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botão Parâmetros */}
              <Dialog open={parametersDialogOpen} onOpenChange={setParametersDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Parâmetros
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Parâmetros de Orçamento</DialogTitle>
                <DialogDescription>
                  Configure o período e o índice IPCA para calcular os valores orçados
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Aviso sobre base de cálculo */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                  <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">ℹ️ Base de Cálculo</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    O orçamento de <strong>{budgetYear}</strong> será calculado usando os valores realizados 
                    dos mesmos meses em <strong>{budgetYear - 1}</strong>.
                  </p>
                  {selectedMonths.length > 0 && (
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Exemplo: Orçamento de Janeiro/{budgetYear} = Realizado Janeiro/{budgetYear - 1} × (1 + {ipcaIndex || '0'}%)
                    </p>
                  )}
                </div>

                {/* Filtro de Ano */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano para Orçamento</label>
                  <Select
                    value={budgetYear.toString()}
                    onValueChange={(value) => {
                      setBudgetYear(parseInt(value));
                      setSelectedMonths([]); // Limpar meses ao trocar ano
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    O orçamento usará como base o ano {budgetYear - 1}
                  </p>
                </div>

                {/* Filtro de Meses */}
                  <div className="space-y-2">
                  <label className="text-sm font-medium">Meses</label>
                  <div className="grid grid-cols-4 gap-2">
                    {MONTHS_SHORT.map((label, index) => {
                      const month = { num: index + 1, label };
                      return (
                      <Button
                        key={month.num}
                        type="button"
                        variant={selectedMonths.includes(month.num) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedMonths((prev) =>
                            prev.includes(month.num)
                              ? prev.filter((m) => m !== month.num)
                              : [...prev, month.num].sort((a, b) => a - b)
                          );
                        }}
                        className="h-9"
                      >
                        {month.label}
                      </Button>
                    );
                    })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                      className="flex-1"
                    >
                      Selecionar Todos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonths([])}
                      className="flex-1"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                
                {/* Índice IPCA */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Índice IPCA (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ipcaIndex}
                    onChange={(e) => setIpcaIndex(e.target.value)}
                    placeholder="Ex: 4.50"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o percentual do IPCA (ex: 4.50 para 4,5%)
                  </p>
                </div>
                
                {/* Fórmula de Cálculo */}
                <div className="bg-muted/50 p-3 rounded-md text-sm border">
                  <p className="font-medium mb-1">Fórmula de Cálculo:</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    Orçado[{budgetYear}] = Realizado[{budgetYear - 1}] × (1 + IPCA/100)
                  </p>
                  {selectedMonths.length > 0 && (
                    <p className="text-muted-foreground text-xs mt-2">
                      Meses: {selectedMonths.map(m => MONTHS_SHORT[m - 1]).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setParametersDialogOpen(false)}
                  disabled={calculatingBudget || clearingBudget}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearBudget}
                  disabled={calculatingBudget || clearingBudget || selectedMonths.length === 0}
                >
                  {clearingBudget ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Limpando...
                    </>
                  ) : (
                    "Limpar Orçamento"
                  )}
                </Button>
                <Button
                  onClick={handleCalculateBudget}
                  disabled={calculatingBudget || clearingBudget || selectedMonths.length === 0 || !ipcaIndex}
                >
                  {calculatingBudget ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calculando...
                    </>
                  ) : (
                    "Calcular Orçamento"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] font-semibold">Descrição</TableHead>
                  {columnLabels.map((label) => (
                    <TableHead key={label} colSpan={3} className="text-center font-semibold border-r border-border">
                      <div className="pb-2">{label}</div>
                      <div className="grid grid-cols-3 gap-1 text-xs font-normal">
                        <div className="text-blue-600 dark:text-blue-400">Orçado</div>
                        <div className="text-card-foreground">Realizado</div>
                        <div className="text-purple-600 dark:text-purple-400">△</div>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead colSpan={3} className="text-center font-semibold">
                    <div className="pb-2">Total</div>
                    <div className="grid grid-cols-3 gap-1 text-xs font-normal">
                      <div className="text-blue-600 dark:text-blue-400">Orçado</div>
                      <div className="text-card-foreground">Realizado</div>
                      <div className="text-purple-600 dark:text-purple-400">△</div>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dreLines.filter(isLineVisible).map((line) => {
                  const total = line.values.reduce((sum, value) => sum + value, 0);
                  const isExpanded = expandedLines.has(line.id);
                  return (
                    <TableRow
                      key={line.id}
                      className={`${getRowClassName(line.type, line.level)} ${line.expandable ? "cursor-pointer" : ""} animate-fade-in`}
                      onClick={() => line.expandable && toggleLineExpansion(line.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {line.expandable && (
                            <div className="transition-transform duration-200">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-card-foreground/70" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-card-foreground/70" />
                              )}
                            </div>
                          )}
                          <div>
                            <span
                              className={
                                line.type === "commitment_type"
                                  ? "font-semibold text-lg text-card-foreground"
                                  : line.type === "commitment_group"
                                    ? "font-medium text-card-foreground"
                                    : "font-normal text-card-foreground"
                              }
                            >
                              {line.label}
                            </span>
                            {line.type === "commitment_type"}
                            {line.type === "commitment_group"}
                          </div>
                        </div>
                      </TableCell>

                      {line.values.map((realizado, periodIndex) => {
                        const orcado = line.budgetedValues[periodIndex];
                        const variacao = realizado - orcado;
                        
                        return (
                          <React.Fragment key={periodIndex}>
                            {/* Orçado */}
                            <TableCell className="text-center text-sm border-r-0">
                              <span className="text-blue-600 dark:text-blue-400">
                                {formatCurrency(orcado)}
                              </span>
                            </TableCell>
                            
                            {/* Realizado */}
                            <TableCell className="text-center text-sm border-r-0">
                              <span
                                className={
                                  realizado > 0
                                    ? "text-success dark:text-success"
                                    : realizado < 0
                                      ? "text-destructive dark:text-destructive"
                                      : "text-card-foreground/60"
                                }
                              >
                                {formatCurrency(realizado)}
                              </span>
                            </TableCell>
                            
                            {/* Variação (△) */}
                            <TableCell className="text-center text-sm border-r border-border">
                              <span
                                className={
                                  variacao > 0
                                    ? "text-success dark:text-success font-medium"
                                    : variacao < 0
                                      ? "text-destructive dark:text-destructive font-medium"
                                      : "text-card-foreground/60"
                                }
                              >
                                {formatCurrency(variacao)}
                              </span>
                            </TableCell>
                          </React.Fragment>
                        );
                      })}

                      {(() => {
                        const totalOrcado = line.budgetedValues.reduce((sum, value) => sum + value, 0);
                        const totalRealizado = line.values.reduce((sum, value) => sum + value, 0);
                        const totalVariacao = totalRealizado - totalOrcado;
                        
                        return (
                          <>
                            {/* Total Orçado */}
                            <TableCell className="text-center font-semibold border-r-0">
                              <span className="text-blue-600 dark:text-blue-400">
                                {formatCurrency(totalOrcado)}
                              </span>
                            </TableCell>
                            
                            {/* Total Realizado */}
                            <TableCell className="text-center font-semibold border-r-0">
                              <span
                                className={
                                  totalRealizado > 0
                                    ? "text-success dark:text-success"
                                    : totalRealizado < 0
                                      ? "text-destructive dark:text-destructive"
                                      : "text-card-foreground/60"
                                }
                              >
                                {formatCurrency(totalRealizado)}
                              </span>
                            </TableCell>
                            
                            {/* Total Variação */}
                            <TableCell className="text-center font-semibold">
                              <span
                                className={
                                  totalVariacao > 0
                                    ? "text-success dark:text-success font-bold"
                                    : totalVariacao < 0
                                      ? "text-destructive dark:text-destructive font-bold"
                                      : "text-card-foreground/60"
                                }
                              >
                                {formatCurrency(totalVariacao)}
                              </span>
                            </TableCell>
                          </>
                        );
                      })()}
                    </TableRow>
                  );
                })}

                {/* ====== Linha de TOTAL (por mês + geral) ====== */}
                <TableRow className="bg-primary/10 font-bold border-t-2 border-primary/30">
                  <TableCell className="uppercase tracking-wide text-card-foreground">Total</TableCell>
                  
                  {monthlyTotals.map((realizado, i) => {
                    const orcado = 0; // Por enquanto sempre 0
                    const variacao = realizado - orcado;
                    
                    return (
                      <React.Fragment key={i}>
                        {/* Orçado */}
                        <TableCell className="text-center border-r-0">
                          <span className="text-blue-600 dark:text-blue-400">
                            {formatCurrency(orcado)}
                          </span>
                        </TableCell>
                        
                        {/* Realizado */}
                        <TableCell className="text-center border-r-0">
                          <span
                            className={
                              realizado > 0
                                ? "text-success dark:text-success"
                                : realizado < 0
                                  ? "text-destructive dark:text-destructive"
                                  : "text-card-foreground/60"
                            }
                          >
                            {formatCurrency(realizado)}
                          </span>
                        </TableCell>
                        
                        {/* Variação */}
                        <TableCell className="text-center border-r border-border">
                          <span
                            className={
                              variacao > 0
                                ? "text-success dark:text-success font-bold"
                                : variacao < 0
                                  ? "text-destructive dark:text-destructive font-bold"
                                  : "text-card-foreground/60"
                            }
                          >
                            {formatCurrency(variacao)}
                          </span>
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Total Geral */}
                  {(() => {
                    const totalOrcadoGeral = 0; // Por enquanto sempre 0
                    const totalRealizadoGeral = grandTotal;
                    const totalVariacaoGeral = totalRealizadoGeral - totalOrcadoGeral;
                    
                    return (
                      <>
                        <TableCell className="text-center border-r-0">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {formatCurrency(totalOrcadoGeral)}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-center border-r-0">
                          <span
                            className={
                              totalRealizadoGeral > 0
                                ? "text-success dark:text-success font-bold"
                                : totalRealizadoGeral < 0
                                  ? "text-destructive dark:text-destructive font-bold"
                                  : "text-card-foreground/60 font-bold"
                            }
                          >
                            {formatCurrency(totalRealizadoGeral)}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <span
                            className={
                              totalVariacaoGeral > 0
                                ? "text-success dark:text-success font-bold"
                                : totalVariacaoGeral < 0
                                  ? "text-destructive dark:text-destructive font-bold"
                                  : "text-card-foreground/60 font-bold"
                            }
                          >
                            {formatCurrency(totalVariacaoGeral)}
                          </span>
                        </TableCell>
                      </>
                    );
                  })()}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default Budget;
