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
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  TreePine,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfYear, endOfYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/components/auth/controle-financeiro/AuthProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface TransactionData {
  id: string;
  amount: number;
  transaction_date: string;
  transaction_type: string;
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

const FinancialStatement: React.FC = () => {
  const { companyId } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyDREData[]>([]);
  const [dreLines, setDreLines] = useState<DRELine[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [unclassifiedCount, setUnclassifiedCount] = useState<number>(0);
  const [showClassificationAlert, setShowClassificationAlert] = useState(false);

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
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Integration dialog states
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
  const [integrationYear, setIntegrationYear] = useState<number>(new Date().getFullYear());
  const [selectedIntegrationMonths, setSelectedIntegrationMonths] = useState<number[]>([]);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrationAvailableYears, setIntegrationAvailableYears] = useState<number[]>([]);

  const currentYear = new Date().getFullYear();
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Fetch available years from integrated transactions
  const fetchAvailableYears = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from("integrated_transactions")
        .select("month_year")
        .eq("company_id", companyId)
        .not("month_year", "is", null)
        .gte("month_year", "2020-01-01");

      if (error) {
        console.error("Error fetching available years:", error);
        return;
      }

      console.log("Raw integrated transaction dates found:", data?.length || 0);
      console.log(
        "Sample dates:",
        data?.slice(0, 5).map((d) => d.month_year),
      );

      // Extract unique years from month_year dates
      const yearsArray: number[] = [];

      if (data) {
        data.forEach((t) => {
          if (t.month_year) {
            try {
              const date = parseISO(t.month_year);
              const year = date.getFullYear();
              if (!yearsArray.includes(year)) {
                yearsArray.push(year);
              }
            } catch (e) {
              console.warn("Invalid date:", t.month_year);
            }
          }
        });
      }

      // Sort descending (most recent first)
      yearsArray.sort((a, b) => b - a);

      console.log("Extracted years:", yearsArray);

      setAvailableYears(yearsArray);

      // If selected year is not in the list, select the most recent year
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

  const fetchIntegrationAvailableYears = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();

      if (!profile?.company_id) return;

      const companyId = profile.company_id;

      const { data, error } = await supabase
        .from("transactions")
        .select("transaction_date")
        .eq("company_id", companyId)
        .order("transaction_date", { ascending: false });

      if (error) {
        console.error("Error fetching available years:", error);
        return;
      }

      if (data && data.length > 0) {
        const years = Array.from(new Set(data.map((item) => new Date(item.transaction_date).getFullYear()))).sort(
          (a, b) => b - a,
        );

        setIntegrationAvailableYears(years);

        if (years.length > 0 && !years.includes(integrationYear)) {
          setIntegrationYear(years[0]);
        }
      } else {
        setIntegrationAvailableYears([new Date().getFullYear()]);
      }
    } catch (error) {
      console.error("Error in fetchAvailableYears:", error);
      setIntegrationAvailableYears([new Date().getFullYear()]);
    }
  };

  const handleIntegrateData = async () => {
    if (selectedIntegrationMonths.length === 0) {
      toast({
        title: "Nenhum mês selecionado",
        description: "Por favor, selecione pelo menos um mês para integrar.",
        variant: "destructive",
      });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();

    if (!profile?.company_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada para o usuário",
        variant: "destructive",
      });
      return;
    }

    const companyId = profile.company_id;
    setIsIntegrating(true);

    try {
      for (const month of selectedIntegrationMonths) {
        const startDate = new Date(integrationYear, month - 1, 1);
        const endDate = new Date(integrationYear, month, 0);
        const monthYearKey = format(startDate, "yyyy-MM-dd");

        const { data: classifiedTransactions, error: fetchError } = await supabase
          .from("transaction_classifications")
          .select(
            `
            commitment_type_id,
            commitment_group_id,
            commitment_id,
            transaction_id,
            transactions!inner(
              amount,
              transaction_date,
              transaction_type,
              company_id
            ),
            commitment_types(name),
            commitment_groups(name),
            commitments(name)
          `,
          )
          .eq("transactions.company_id", companyId)
          .gte("transactions.transaction_date", format(startDate, "yyyy-MM-dd"))
          .lte("transactions.transaction_date", format(endDate, "yyyy-MM-dd"));

        if (fetchError) {
          console.error("Error fetching transactions:", fetchError);
          throw fetchError;
        }

        const classifiedIds = classifiedTransactions?.map((ct) => ct.transaction_id) || [];
        const { data: unclassifiedTransactions, error: unclassifiedError } = await supabase
          .from("transactions")
          .select("id, amount, transaction_date, transaction_type")
          .eq("company_id", companyId)
          .gte("transaction_date", format(startDate, "yyyy-MM-dd"))
          .lte("transaction_date", format(endDate, "yyyy-MM-dd"))
          .not("id", "in", `(${classifiedIds.length > 0 ? classifiedIds.join(",") : "''"})`);

        if (unclassifiedError) {
          console.error("Error fetching unclassified transactions:", unclassifiedError);
          throw unclassifiedError;
        }

        const aggregations = new Map<
          string,
          {
            commitment_type_id: string | null;
            commitment_group_id: string | null;
            commitment_id: string | null;
            type_name: string;
            group_name: string;
            commitment_name: string;
            total_amount: number;
            transaction_count: number;
          }
        >();

        for (const item of classifiedTransactions) {
          const key = `${item.commitment_type_id || "null"}_${item.commitment_group_id || "null"}_${item.commitment_id || "null"}`;

          if (!aggregations.has(key)) {
            aggregations.set(key, {
              commitment_type_id: item.commitment_type_id,
              commitment_group_id: item.commitment_group_id,
              commitment_id: item.commitment_id,
              type_name: item.commitment_types?.name || "Não classificado",
              group_name: item.commitment_groups?.name || "Não classificado",
              commitment_name: item.commitments?.name || "Não classificado",
              total_amount: 0,
              transaction_count: 0,
            });
          }

          const agg = aggregations.get(key)!;
          const amount =
            item.transactions.transaction_type === "credit"
              ? Math.abs(Number(item.transactions.amount))
              : -Math.abs(Number(item.transactions.amount));
          agg.total_amount += amount;
          agg.transaction_count += 1;
        }

        // Transações não classificadas são ignoradas (não integradas)

        const integrationsToInsert = Array.from(aggregations.values()).map((agg) => ({
          company_id: companyId,
          month_year: monthYearKey,
          commitment_type_id: agg.commitment_type_id,
          commitment_group_id: agg.commitment_group_id,
          commitment_id: agg.commitment_id,
          type_name: agg.type_name,
          group_name: agg.group_name,
          commitment_name: agg.commitment_name,
          total_amount: agg.total_amount,
          transaction_count: agg.transaction_count,
        }));

        const { error: upsertError } = await supabase.from("integrated_transactions").upsert(integrationsToInsert, {
          onConflict: "company_id,month_year,commitment_type_id,commitment_group_id,commitment_id",
          ignoreDuplicates: false,
        });

        if (upsertError) {
          console.error("Error upserting integrations:", upsertError);
          throw upsertError;
        }
      }

      toast({
        title: "Integração concluída",
        description: `Dados de ${selectedIntegrationMonths.length} mês(es) foram integrados com sucesso.`,
      });

      setIsIntegrationDialogOpen(false);
      setSelectedIntegrationMonths([]);
    } catch (error: any) {
      console.error("Integration error:", error);
      toast({
        title: "Erro na integração",
        description: error.message || "Ocorreu um erro ao integrar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsIntegrating(false);
    }
  };

  const fetchClassificationStats = async () => {
    if (!companyId) return;

    try {
      // Buscar total de transações
      const { count: totalCount, error: totalError } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      if (totalError) throw totalError;

      // Buscar transações classificadas
      const { data: classifiedData, error: classifiedError } = await supabase
        .from("transaction_classifications")
        .select("transaction_id, transactions!inner(company_id)")
        .eq("transactions.company_id", companyId);

      if (classifiedError) throw classifiedError;

      const totalTransactions = totalCount || 0;
      const classifiedTransactions = classifiedData?.length || 0;
      const unclassified = totalTransactions - classifiedTransactions;

      setUnclassifiedCount(unclassified);
      setShowClassificationAlert(unclassified > 0);
    } catch (error) {
      console.error("Erro ao buscar estatísticas de classificação:", error);
    }
  };

  const handleLoadData = async () => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive",
      });
      return;
    }

    setHasLoadedData(true);
    const configs = await fetchConfigurations();
    await fetchTransactionData(configs);
    await fetchClassificationStats();
  };

  useEffect(() => {
    if (companyId) {
      fetchAvailableYears();
    }

    // Setup real-time listeners apenas se dados já foram carregados
    const transactionChannel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "integrated_transactions",
        },
        () => {
          if (hasLoadedData) {
            fetchAvailableYears();
            const loadData = async () => {
              const configs = await fetchConfigurations();
              await fetchTransactionData(configs);
            };
            loadData();
          }
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
          if (hasLoadedData) {
            const loadData = async () => {
              const configs = await fetchConfigurations();
              await fetchTransactionData(configs);
            };
            loadData();
          }
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
          if (hasLoadedData) {
            fetchClassificationStats();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
    };
  }, [selectedYear, hasLoadedData, companyId]);

  const fetchTransactionData = async (configs: Configs) => {
    if (!companyId) return;

    setLoading(true);
    try {
      const startDate = startOfYear(new Date(selectedYear, 0, 1));
      const endDate = endOfYear(new Date(selectedYear, 11, 31));

      // Buscar dados integrados já agregados por mês
      const { data: integratedData, error: integratedError } = await supabase
        .from("integrated_transactions")
        .select("*")
        .eq("company_id", companyId)
        .gte("month_year", format(startDate, "yyyy-MM-dd"))
        .lte("month_year", format(endDate, "yyyy-MM-dd"))
        .order("month_year", { ascending: true });

      if (integratedError) {
        console.error("Error fetching integrated transactions:", integratedError);
        throw integratedError;
      }

      if (!integratedData || integratedData.length === 0) {
        setTransactions([]);
        processDataForDRE([]);
        return;
      }

      // Converter para formato esperado pelo processDataForDRE
      // Cada linha da integrated_transactions representa uma agregação mensal
      const processedData = integratedData.map((row) => ({
        id: row.id,
        amount: row.total_amount,
        transaction_date: row.month_year,
        transaction_type: row.total_amount >= 0 ? "credit" : "debit",
        description: `${row.commitment_name} (${row.transaction_count} transações)`,
        classification: {
          commitment: {
            id: row.commitment_id,
            name: row.commitment_name,
          },
          commitment_group: {
            id: row.commitment_group_id,
            name: row.group_name,
          },
          commitment_type: {
            id: row.commitment_type_id,
            name: row.type_name,
          },
        },
      }));

      setTransactions(processedData);
      processDataForDRE(processedData);
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

  const processDataForDRE = (transactions: TransactionData[]) => {
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
              }
            >;
            values: number[];
          }
        >;
        values: number[];
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

      // Log para debug - verificar estrutura da classificação (apenas uma vez)
      if (!hasLoggedSample && classification) {
        // console.log("=== ESTRUTURA DA CLASSIFICAÇÃO (sample) ===");
        // console.log("classification.commitment:", classification.commitment);
        // console.log("classification.commitment_group:", classification.commitment_group);
        // console.log("classification.commitment_type:", classification.commitment_type);
        hasLoggedSample = true;
      }

      let commitmentTypeId: string;
      let commitmentTypeName: string;
      let commitmentGroupId: string;
      let commitmentGroupName: string;
      let commitmentId: string;
      let commitmentName: string;

      if (classification?.commitment) {
        // Full classification with commitment
        commitmentId = classification.commitment.id || "unknown";
        commitmentName = classification.commitment.name;
        // Usar os dados do nível superior do classification, não do commitment aninhado
        commitmentGroupId = classification.commitment_group?.id || "unknown";
        commitmentGroupName = classification.commitment_group?.name || "Grupo Desconhecido";
        commitmentTypeId = classification.commitment_type?.id || "unknown";
        commitmentTypeName = classification.commitment_type?.name || "Tipo Desconhecido";
      } else if (classification?.commitment_group) {
        // Group classification only
        commitmentId = "outros";
        commitmentName = "Outros";
        commitmentGroupId = classification.commitment_group.id || "unknown";
        commitmentGroupName = classification.commitment_group.name;
        commitmentTypeId = classification.commitment_type?.id || "unknown";
        commitmentTypeName = classification.commitment_type?.name || "Tipo Desconhecido";
      } else if (classification?.commitment_type) {
        // Type classification only
        commitmentId = "outros";
        commitmentName = "Outros";
        commitmentGroupId = "outros";
        commitmentGroupName = "Outros";
        commitmentTypeId = classification.commitment_type.id || "unknown";
        commitmentTypeName = classification.commitment_type.name;
      } else {
        // Ignorar transações sem classificação
        return;
      }

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
        });
      }
      const commitmentData = groupData.commitments.get(commitmentId)!;
      commitmentData.values[monthIndex] += amount;
    });

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
        expandable: typeData.groups.size > 0,
        expanded: false,
        itemId: typeId,
      });

      // Add commitment groups
      typeData.groups.forEach((groupData, groupId) => {
        lines.push({
          id: `group-${groupId}`,
          label: `  ${groupData.group.name}`,
          type: "commitment_group",
          level: 1,
          values: groupData.values,
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
            expandable: false,
            parentId: `group-${groupId}`,
            itemId: commitmentId,
          });
        });
      });
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

  // Mensagem quando ainda não carregou dados
  if (!hasLoadedData && dreLines.length === 0) {
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

            <Button onClick={handleLoadData} variant="default" size="sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Carregando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Carregar
                </>
              )}
            </Button>

            <Dialog
              open={isIntegrationDialogOpen}
              onOpenChange={(open) => {
                setIsIntegrationDialogOpen(open);
                if (open) {
                  fetchIntegrationAvailableYears();
                }
              }}
            >
              <DialogTrigger asChild>
                {/* <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Integração
                </Button> */}
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Integrar Dados</DialogTitle>
                  <DialogDescription>
                    Selecione os meses que deseja integrar para o demonstrativo financeiro
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ano</label>
                    <Select
                      value={integrationYear.toString()}
                      onValueChange={(value) => {
                        setIntegrationYear(parseInt(value));
                        setSelectedIntegrationMonths([]);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {integrationAvailableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meses</label>
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month, index) => {
                        const monthValue = index + 1;
                        const isSelected = selectedIntegrationMonths.includes(monthValue);
                        return (
                          <Button
                            key={month}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedIntegrationMonths((prev) =>
                                isSelected
                                  ? prev.filter((m) => m !== monthValue)
                                  : [...prev, monthValue].sort((a, b) => a - b),
                              );
                            }}
                          >
                            {month}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsIntegrationDialogOpen(false)}
                      disabled={isIntegrating}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleIntegrateData}
                      disabled={isIntegrating || selectedIntegrationMonths.length === 0}
                    >
                      {isIntegrating ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Integrando...
                        </>
                      ) : (
                        "Integrar"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Nenhum dado carregado</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Selecione um ano e clique em <strong>"Carregar"</strong> para visualizar o demonstrativo financeiro.
            </p>
          </CardContent>
        </Card>
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

          <Button onClick={handleLoadData} variant="default" size="sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Carregando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Carregar
              </>
            )}
          </Button>

          <Dialog
            open={isIntegrationDialogOpen}
            onOpenChange={(open) => {
              setIsIntegrationDialogOpen(open);
              if (open) {
                fetchIntegrationAvailableYears();
              }
            }}
          >
            <DialogTrigger asChild>
              {/* <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Integração
              </Button> */}
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Integração de Dados</DialogTitle>
                <DialogDescription>
                  Selecione os meses para consolidar as transações classificadas por Tipo, Grupo e Natureza
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                  <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">ℹ️ Como funciona</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Os valores serão agregados por <strong>Tipo → Grupo → Natureza</strong> para cada mês selecionado.
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Se você integrar novamente o mesmo mês, os valores anteriores serão <strong>substituídos</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano</label>
                  <Select
                    value={integrationYear.toString()}
                    onValueChange={(value) => {
                      setIntegrationYear(parseInt(value));
                      setSelectedIntegrationMonths([]);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {integrationAvailableYears.length > 0 ? (
                        integrationAvailableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

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
                        variant={selectedIntegrationMonths.includes(month.num) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedIntegrationMonths((prev) =>
                            prev.includes(month.num)
                              ? prev.filter((m) => m !== month.num)
                              : [...prev, month.num].sort((a, b) => a - b),
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
                      onClick={() => setSelectedIntegrationMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                      className="flex-1"
                    >
                      Selecionar Todos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIntegrationMonths([])}
                      className="flex-1"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>

                {selectedIntegrationMonths.length > 0 && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm border">
                    <p className="font-medium mb-1">Resumo da Integração:</p>
                    <p className="text-muted-foreground text-xs">
                      Ano: <strong>{integrationYear}</strong>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Meses:{" "}
                      {selectedIntegrationMonths
                        .map((m) => {
                          const monthNames = [
                            "Jan",
                            "Fev",
                            "Mar",
                            "Abr",
                            "Mai",
                            "Jun",
                            "Jul",
                            "Ago",
                            "Set",
                            "Out",
                            "Nov",
                            "Dez",
                          ];
                          return monthNames[m - 1];
                        })
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsIntegrationDialogOpen(false)} disabled={isIntegrating}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleIntegrateData}
                  disabled={isIntegrating || selectedIntegrationMonths.length === 0}
                >
                  {isIntegrating ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Integrando...
                    </>
                  ) : (
                    "Integrar"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-card-foreground">
                Demonstrativo de Resultados
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Demonstração detalhada de receitas, custos e despesas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showClassificationAlert && hasLoadedData && (
            <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertTitle className="text-orange-800 dark:text-orange-300">
                Atenção: Transações não classificadas
              </AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                Existem <strong>{unclassifiedCount} transações sem classificação</strong>. 
                Isso pode comprometer a precisão dos resultados mostrados nesta página, 
                pois apenas transações classificadas são incluídas no demonstrativo.
                <Button
                  variant="link"
                  className="h-auto p-0 ml-1 text-orange-800 dark:text-orange-300 underline"
                  onClick={() => navigate("/transaction-classification")}
                >
                  Classificar transações agora →
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] font-semibold">Descrição</TableHead>
                  {months.map((month) => (
                    <TableHead key={month} className="text-center font-semibold min-w-[120px]">
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-semibold min-w-[120px]">Total</TableHead>
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

                      {line.values.map((value, monthIndex) => (
                        <TableCell key={monthIndex} className="text-center">
                          <span
                            className={
                              value > 0
                                ? "text-success dark:text-success"
                                : value < 0
                                  ? "text-destructive dark:text-destructive"
                                  : "text-card-foreground/60"
                            }
                          >
                            {formatCurrency(value)}
                          </span>
                        </TableCell>
                      ))}

                      <TableCell className="text-center font-semibold">
                        <span
                          className={
                            total > 0
                              ? "text-success dark:text-success"
                              : total < 0
                                ? "text-destructive dark:text-destructive"
                                : "text-card-foreground/60"
                          }
                        >
                          {formatCurrency(total)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* ====== Linha de TOTAL (por mês + geral) ====== */}
                <TableRow className="bg-primary/10 font-bold border-t border-primary/30">
                  <TableCell className="uppercase tracking-wide text-card-foreground">Total</TableCell>
                  {monthlyTotals.map((value, i) => (
                    <TableCell key={i} className="text-center">
                      <span
                        className={
                          value > 0
                            ? "text-success dark:text-success"
                            : value < 0
                              ? "text-destructive dark:text-destructive"
                              : "text-card-foreground/60"
                        }
                      >
                        {formatCurrency(value)}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    <span
                      className={
                        grandTotal > 0
                          ? "text-success dark:text-success"
                          : grandTotal < 0
                            ? "text-destructive dark:text-destructive"
                            : "text-card-foreground/60"
                      }
                    >
                      {formatCurrency(grandTotal)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="text-sm text-card-foreground/70">Total de Tipos de Natureza</div>
            <div className="text-2xl font-bold text-primary">{commitmentTypes.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="text-sm text-card-foreground/70">Total de Transações</div>
            <div className="text-2xl font-bold text-primary">{transactions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="text-sm text-card-foreground/80">
            <strong className="text-card-foreground">Nota:</strong> Este demonstrativo apresenta a organização
            hierárquica dos dados financeiros baseada nos tipos de natureza, grupos de natureza e naturezas individuais
            conforme cadastrados no sistema. Os valores são compostos pelas movimentações bancárias classificadas e
            atualizados em tempo real.
          </div>
        </CardContent>
      </Card>*/}
    </div>
  );
};

export default FinancialStatement;
