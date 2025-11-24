import React, { useState, useEffect, useMemo } from "react";
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
import { FileText, TrendingUp, TrendingDown, ChevronRight, ChevronDown, TreePine, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfYear, endOfYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/components/auth/controle-financeiro/AuthProvider";

interface TransactionData {
  id: string;
  amount: number;
  transaction_date: string;
  transaction_type: string;
  description?: string;
  classification?: {
    commitment?: {
      id?: string;
      name: string;
      commitment_group?: {
        id?: string;
        name: string;
        commitment_type?: {
          id?: string;
          name: string;
        };
      };
      commitment_type?: {
        id?: string;
        name: string;
      };
    };
    commitment_group?: {
      id?: string;
      name: string;
      commitment_type?: {
        id?: string;
        name: string;
      };
    };
    commitment_type?: {
      id?: string;
      name: string;
    };
  };
}

interface MonthlyDREData {
  month: string;
  [key: string]: string | number; // Allow dynamic commitment type totals
}

interface DRELine {
  id: string;
  label: string;
  type: "commitment_type" | "commitment_group" | "commitment" | "unclassified";
  level: number;
  values: number[];
  budgetedValues: number[]; // Budgeted amounts for each month
  expandable?: boolean;
  expanded?: boolean;
  parentId?: string;
  children?: DRELine[];
  itemId?: string; // Reference to the actual commitment_type/group/commitment ID
}

interface CommitmentGroupData {
  id: string;
  name: string;
  type: "revenue" | "cost" | "expense";
  values: number[];
  commitments: CommitmentData[];
}

interface CommitmentData {
  id: string;
  name: string;
  values: number[];
}

interface DREConfiguration {
  id: string;
  line_type: "revenue" | "cost" | "expense";
  commitment_group_id: string;
  commitment_id: string | null;
}

interface CommitmentGroup {
  id: string;
  name: string;
  color: string;
  company_id: string;
}

interface Commitment {
  id: string;
  name: string;
  commitment_group_id: string;
  commitment_type_id?: string;
}

interface CommitmentType {
  id: string;
  name: string;
  company_id: string;
}

interface Configs {
  groups: CommitmentGroup[];
  commitments: Commitment[];
  commitmentTypes: CommitmentType[];
  dreConfigurations: DREConfiguration[];
}

const Budget: React.FC = () => {
  const { companyId } = useAuth();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyDREData[]>([]);
  const [dreLines, setDreLines] = useState<DRELine[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

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
  const [budgetForecasts, setBudgetForecasts] = useState<any[]>([]);

  const currentYear = new Date().getFullYear();
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Fetch available years from transactions
  const fetchAvailableYears = async () => {
    if (!companyId) return;

    try {
      // Buscar anos de transações classificadas (que aparecem no DRE)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transaction_classifications")
        .select(`
          transaction_id,
          transactions!inner(
            transaction_date,
            company_id
          )
        `)
        .eq("transactions.company_id", companyId)
        .not("transactions.transaction_date", "is", null)
        .gte("transactions.transaction_date", "2020-01-01");

      if (transactionsError) {
        console.error("Error fetching transaction years:", transactionsError);
      }

      // Buscar anos de orçamento calculado
      // @ts-ignore - Tipagem complexa do Supabase causando erro
      const { data: forecastsData, error: forecastsError } = await supabase
        // @ts-ignore
        .from("budget_forecasts")
        .select("month_year")
        .eq("company_id", companyId)
        .not("month_year", "is", null)
        .order("month_year", { ascending: false });

      console.log("🔍 Query budget_forecasts:", {
        companyId,
        dataLength: forecastsData?.length || 0,
        error: forecastsError,
        sampleData: forecastsData?.slice(0, 3)
      });

      if (forecastsError) {
        console.error("Error fetching budget forecast years:", forecastsError);
      }

      // Usar Set para extrair anos únicos de forma eficiente
      const yearsSet = new Set<number>();
      const transactionYears = new Set<number>();
      const forecastYears = new Set<number>();

      // Extrair anos únicos de transações classificadas
      if (transactionsData) {
        transactionsData.forEach((t: any) => {
          // @ts-ignore - Estrutura join do Supabase
          if (t.transactions?.transaction_date) {
            try {
              // Extrair ano diretamente da string para evitar problemas de timezone
              const year = parseInt(t.transactions.transaction_date.substring(0, 4), 10);
              transactionYears.add(year);
              yearsSet.add(year);
            } catch (e) {
              console.warn("Invalid transaction date:", t.transactions?.transaction_date);
            }
          }
        });
      }

      // Extrair anos únicos de budget_forecasts
      if (forecastsData) {
        // @ts-ignore - Tipo inferido incorretamente pelo Supabase
        forecastsData.forEach((f: any) => {
          if (f.month_year) {
            try {
              // Extrair ano diretamente da string para evitar problemas de timezone
              const year = parseInt(f.month_year.substring(0, 4), 10);
              forecastYears.add(year);
              yearsSet.add(year);
            } catch (e) {
              console.warn("Invalid forecast date:", f.month_year);
            }
          }
        });
      }

      // Converter Set para Array e ordenar decrescente (mais recente primeiro)
      const yearsArray = Array.from(yearsSet).sort((a, b) => b - a);

      // Logs informativos
      console.log("📊 Anos encontrados em transações classificadas:", Array.from(transactionYears).sort((a, b) => b - a));
      console.log("📈 Anos encontrados em budget_forecasts:", Array.from(forecastYears).sort((a, b) => b - a));
      console.log("📦 Raw forecastsData length:", forecastsData?.length || 0);
      console.log("📦 Raw forecastsData sample:", forecastsData?.slice(0, 2));
      console.log("🎯 Company ID usado na query:", companyId);
      console.log("✅ Anos disponíveis no filtro (combinados):", yearsArray);

      setAvailableYears(yearsArray);

      // Se o ano selecionado não está na lista, selecionar o mais recente
      if (yearsArray.length > 0 && !yearsArray.includes(selectedYear)) {
        setSelectedYear(yearsArray[0]);
      }
    } catch (error) {
      console.error("Error fetching available years:", error);
    }
  };

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

  useEffect(() => {
    const loadData = async () => {
      const configs = await fetchConfigurations();
      await fetchTransactionData(configs);
    };

    if (companyId) {
      fetchAvailableYears();
      loadData();
    }

    // Setup real-time listeners
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
          fetchAvailableYears(); // Update available years when transactions change
          loadData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transaction_classifications",
        },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ofx_uploads",
        },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dre_line_configurations",
        },
        () => {
          loadData();
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
          fetchAvailableYears(); // Update available years when budget forecasts change
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
    };
  }, [selectedYear]);

  const fetchTransactionData = async (configs: Configs) => {
    if (!companyId) return;

    setLoading(true);
    try {
      const startDate = startOfYear(new Date(selectedYear, 0, 1));
      const endDate = endOfYear(new Date(selectedYear, 11, 31));

      // First, get all transactions for the year
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("id, amount, transaction_date, transaction_type, description")
        .eq("company_id", companyId)
        .gte("transaction_date", format(startDate, "yyyy-MM-dd"))
        .lte("transaction_date", format(endDate, "yyyy-MM-dd"))
        .order("transaction_date", { ascending: true });

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        throw transactionsError;
      }

      // Buscar valores orçados (independente de haver transações)
      const forecasts = await fetchBudgetForecasts(selectedYear);
      setBudgetForecasts(forecasts);

      if (!transactionsData || transactionsData.length === 0) {
        setTransactions([]);
        processDataForDRE([], forecasts, configs);
        return;
      }

      // Get transaction IDs
      const transactionIds = transactionsData.map((t) => t.id);

      // Helper para dividir array em chunks
      const chunkArray = <T,>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };

      // Dividir transaction IDs em chunks de 100 para evitar erro "Bad Request"
      const transactionIdChunks = chunkArray(transactionIds, 100);

      // Buscar classificações em paralelo
      const classificationsPromises = transactionIdChunks.map((chunk) =>
        supabase
          .from("transaction_classifications")
          .select("transaction_id, commitment_id, commitment_group_id, commitment_type_id")
          .in("transaction_id", chunk),
      );

      const classificationsResults = await Promise.all(classificationsPromises);

      // Combinar todos os resultados
      let classificationsData: any[] = [];
      let classificationsError = null;

      for (const result of classificationsResults) {
        if (result.error) {
          classificationsError = result.error;
          break;
        }
        if (result.data) {
          classificationsData.push(...result.data);
        }
      }

      if (classificationsError) {
        console.error("Error fetching classifications:", classificationsError);
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
      
      processDataForDRE(processedData, forecasts, configs);
    } catch (error) {
      console.error("Error fetching transaction data:", error);
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

  const fetchBudgetForecasts = async (year: number) => {
    if (!companyId) return [];

    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const { data, error } = await (supabase as any)
        .from("budget_forecasts")
        .select("*")
        .eq("company_id", companyId)
        .gte("month_year", format(startDate, "yyyy-MM-dd"))
        .lte("month_year", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      console.log(`📊 Loaded ${data?.length || 0} budget forecasts for ${year}`);
      return data || [];
    } catch (error) {
      console.error("Error fetching budget forecasts:", error);
      return [];
    }
  };

  const processDataForDRE = (transactions: TransactionData[], budgetForecasts: any[] = [], configs: Configs) => {
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

    // Initialize months data
    const monthlyResults: MonthlyDREData[] = [];
    for (let i = 0; i < 12; i++) {
      monthlyResults.push({ month: months[i] });
    }

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
    
    console.log(`✅ Budget forecasts processed successfully`);

    setMonthlyData(monthlyResults);

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
        values: typeData.values,
        budgetedValues: typeData.budgetedValues || new Array(12).fill(0),
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
          values: groupData.values,
          budgetedValues: groupData.budgetedValues || new Array(12).fill(0),
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
            values: commitmentData.values,
            budgetedValues: commitmentData.budgetedValues || new Array(12).fill(0),
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getValueIcon = (value: number, type: string) => {
    if (type === "commitment_type" && value > 0) {
      return;
    }
    if (type === "commitment_type" && value < 0) {
      return;
    }
    return null;
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
    if (!companyId) {
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

      // Buscar transações do ANO ANTERIOR para os meses selecionados
      const { data: previousYearTransactions, error: transError } = await supabase
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
        .eq("company_id", companyId)
        .gte("transaction_date", `${previousYear}-01-01`)
        .lte("transaction_date", `${previousYear}-12-31`);

      if (transError) throw transError;

      console.log(`🔍 Transações encontradas em ${previousYear}:`, previousYearTransactions?.length || 0);

      // DIAGNÓSTICO: Verificar transações com classificação
      const transactionsWithClassification = previousYearTransactions?.filter(t => 
        t.transaction_classifications && 
        (t.transaction_classifications.commitment_type_id || 
         t.transaction_classifications.commitment_group_id || 
         t.transaction_classifications.commitment_id)
      ) || [];

      console.log(`📊 Transações com classificação: ${transactionsWithClassification.length}`);

      if (transactionsWithClassification.length > 0) {
        console.log(`📋 Exemplo de transação classificada:`, {
          id: transactionsWithClassification[0].id,
          date: transactionsWithClassification[0].transaction_date,
          amount: transactionsWithClassification[0].amount,
          classification: transactionsWithClassification[0].transaction_classifications
        });
      }

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

      console.log(`📊 Análise de disponibilidade de dados:`);
      console.log(`  ✅ Meses com transações classificadas (${previousYear}):`, monthsWithData.map(m => months[m-1]).join(', ') || 'Nenhum');
      console.log(`  ❌ Meses sem transações classificadas (${previousYear}):`, monthsWithoutData.map(m => months[m-1]).join(', ') || 'Nenhum');

      // Gerar budget forecasts
      const budgetForecasts: any[] = [];

      selectedMonths.forEach(monthNum => {
        const monthStr = monthNum.toString().padStart(2, '0');
        const targetMonthDate = `${targetYear}-${monthStr}-01`;
        const monthData = realizedByMonth.get(monthStr);

        if (!monthData) return;

        // Criar um registro por commitment completo com toda a hierarquia
        monthData.forEach((item) => {
          const orcado = item.value * multiplier;
          budgetForecasts.push({
            company_id: companyId,
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

      console.log(`📋 Total de budget forecasts gerados: ${budgetForecasts.length}`);

      if (budgetForecasts.length === 0) {
        const monthsRequested = selectedMonths.map(m => months[m-1]).join(', ');
        
        toast({
          title: "Nenhum orçamento foi gerado",
          description: `Não há transações classificadas em ${previousYear} para os meses: ${monthsRequested}. Classifique as transações de ${previousYear} primeiro.`,
          variant: "destructive"
        });
        
        setCalculatingBudget(false);
        return;
      }

      if (budgetForecasts.length > 0) {
        console.log('📋 Sample budget record:', budgetForecasts[0]);
        console.log('📋 Company ID being used:', companyId);
        console.log(`📋 Total registros: ${budgetForecasts.length} (1 registro por commitment com hierarquia completa)`);
      }

      // Deletar orçamentos antigos dos meses selecionados
      for (const monthNum of selectedMonths) {
        const monthStr = monthNum.toString().padStart(2, '0');
        const targetMonthDate = `${targetYear}-${monthStr}-01`;
        
        const { error: deleteError } = await (supabase as any)
          .from("budget_forecasts")
          .delete()
          .eq("company_id", companyId)
          .eq("month_year", targetMonthDate);

        if (deleteError) {
          console.error(`Erro ao deletar orçamento de ${targetMonthDate}:`, deleteError);
        }
      }

      // Inserir novos orçamentos
      if (budgetForecasts.length > 0) {
        console.log('💾 Iniciando inserção de', budgetForecasts.length, 'registros...');
        
        const { data: insertedData, error: insertError } = await supabase
          .from("budget_forecasts")
          .insert(budgetForecasts)
          .select();

        if (insertError) {
          console.error("❌ Erro ao inserir forecasts:", insertError);
          console.error("❌ Detalhes:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          throw new Error(`Falha ao salvar orçamento: ${insertError.message}`);
        }

        console.log('✅ Inserção concluída com sucesso!');
        console.log('✅ Registros inseridos:', insertedData?.length || 0);
        
        if (insertedData && insertedData.length > 0) {
          console.log('✅ Primeiro registro inserido:', insertedData[0]);
        }

        // Verificar se os registros foram realmente salvos
        console.log('🔍 Verificando registros salvos...');

        for (const monthNum of selectedMonths) {
          const monthStr = monthNum.toString().padStart(2, '0');
          const targetMonthDate = `${targetYear}-${monthStr}-01`;
          
          const { data: verifyData, error: verifyError } = await supabase
            .from("budget_forecasts")
            .select("id")
            .eq("company_id", companyId)
            .eq("month_year", targetMonthDate);

          if (verifyError) {
            console.error(`❌ Erro ao verificar mês ${monthStr}:`, verifyError);
          } else {
            console.log(`✅ Mês ${monthStr}: ${verifyData?.length || 0} registros encontrados`);
          }
        }
      }

      // Aguardar commit no banco antes de buscar anos atualizados
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recalcular quais meses realmente tiveram orçamento gerado
      const monthsWithBudget = new Set<number>();
      budgetForecasts.forEach(forecast => {
        const monthMatch = forecast.month_year.match(/-(\d{2})-/);
        if (monthMatch) {
          monthsWithBudget.add(parseInt(monthMatch[1], 10));
        }
      });

      const generatedMonthsArray = Array.from(monthsWithBudget).sort((a, b) => a - b);
      const generatedMonthsNames = generatedMonthsArray.map(m => months[m-1]).join(', ');
      
      const missingMonths = selectedMonths.filter(m => !monthsWithBudget.has(m));
      const missingMonthsNames = missingMonths.map(m => months[m-1]).join(', ');

      // Atualizar tabela
      const configs = await fetchConfigurations();
      await fetchTransactionData(configs);
      await fetchAvailableYears();
      setParametersDialogOpen(false);

      // Mensagem de sucesso mais informativa
      if (missingMonths.length === 0) {
        // Todos os meses solicitados foram gerados
        toast({
          title: "Orçamento calculado com sucesso!",
          description: `${budgetForecasts.length} registros salvos para ${generatedMonthsNames} de ${targetYear}.`,
        });
      } else {
        // Alguns meses não foram gerados
        toast({
          title: "Orçamento calculado parcialmente",
          description: `✅ Gerado: ${generatedMonthsNames}${missingMonthsNames ? `\n⚠️ Sem base de cálculo em ${previousYear}: ${missingMonthsNames}` : ''}`,
        });
      }

    } catch (error: any) {
      console.error("Erro ao calcular orçamento:", error);
      toast({
        title: "Erro ao calcular orçamento",
        description: error.message || "Não foi possível calcular o orçamento",
        variant: "destructive",
      });
    } finally {
      setCalculatingBudget(false);
    }
  };

  const handleClearBudget = async () => {
    if (!companyId) {
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
        
        const { error: deleteError } = await (supabase as any)
          .from("budget_forecasts")
          .delete()
          .eq("company_id", companyId)
          .eq("month_year", targetMonthDate);

        if (deleteError) {
          console.error(`Erro ao deletar orçamento de ${targetMonthDate}:`, deleteError);
          throw deleteError;
        }
      }

      const configs = await fetchConfigurations();
      await fetchTransactionData(configs);
      await fetchAvailableYears();
      setParametersDialogOpen(false);
      toast({
        title: "Orçamento limpo",
        description: `Orçamento limpo para ${selectedMonths.length} mês(es) de ${budgetYear}`,
      });

    } catch (error: any) {
      console.error("Erro ao limpar orçamento:", error);
      toast({
        title: "Erro ao limpar orçamento",
        description: error.message || "Não foi possível limpar o orçamento",
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
      console.error("Error removing configuration:", error);
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

  const getLineTypeLabel = (type: "revenue" | "cost" | "expense") => {
    switch (type) {
      case "revenue":
        return "Receita";
      case "cost":
        return "Custo";
      case "expense":
        return "Despesa";
    }
  };

  const getLineTypeColor = (type: "revenue" | "cost" | "expense") => {
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
    const totals = new Array(12).fill(0);
    dreLines.forEach((l) => {
      if (l.level === 0) {
        l.values.forEach((v, i) => {
          totals[i] += v;
        });
      }
    });
    return totals;
  }, [dreLines]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.length > 0 ? (
                availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
              )}
            </SelectContent>
          </Select>
          
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
                    {[
                      { num: 1, label: "Jan" },
                      { num: 2, label: "Fev" },
                      { num: 3, label: "Mar" },
                      { num: 4, label: "Abr" },
                      { num: 5, label: "Mai" },
                      { num: 6, label: "Jun" },
                      { num: 7, label: "Jul" },
                      { num: 8, label: "Ago" },
                      { num: 9, label: "Set" },
                      { num: 10, label: "Out" },
                      { num: 11, label: "Nov" },
                      { num: 12, label: "Dez" },
                    ].map((month) => (
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
                    ))}
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
                      Meses: {selectedMonths.map(m => {
                        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                        return monthNames[m - 1];
                      }).join(', ')}
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
                  {months.map((month) => (
                    <TableHead key={month} colSpan={3} className="text-center font-semibold border-r border-border">
                      <div className="pb-2">{month}</div>
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
                          {getValueIcon(total, line.type)}
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

                      {line.values.map((realizado, monthIndex) => {
                        const orcado = line.budgetedValues[monthIndex];
                        const variacao = realizado - orcado;
                        
                        return (
                          <React.Fragment key={monthIndex}>
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
    </div>
  );
};

export default Budget;
