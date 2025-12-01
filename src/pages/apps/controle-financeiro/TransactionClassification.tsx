import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Calendar as CalendarIcon,
  Save,
  Download,
  Check,
  Clock,
  Settings,
  Plus,
  TreePine,
  FileSpreadsheet,
  Filter,
  X,
  Loader2,
} from "lucide-react";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CommitmentHierarchy } from "@/components/controle-financeiro/CommitmentHierarchy";
import { Progress } from "@/components/ui/progress";

// Types
interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  transaction_type: "credit" | "debit";
  memo?: string;
  bank_id: string;
  company_id: string;
  balance?: number;
  fitid?: string;
  ofx_import_date?: string;
  created_at: string;
  updated_at: string;
  bank?: {
    bank_name: string;
    bank_code: string;
  };
  classification?: {
    id: string;
    group_name: string;
    group_color: string;
    commitment_name?: string;
    type_name?: string;
  };
}

interface ClassificationRule {
  id: string;
  rule_name: string;
  description_contains: string;
  commitment_group_id?: string;
  commitment_id?: string;
  commitment_type_id?: string;
  bank_id?: string;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

interface CommitmentGroup {
  id: string;
  name: string;
  color: string;
  description?: string;
  company_id: string;
}

interface Commitment {
  id: string;
  name: string;
  commitment_group_id: string;
  commitment_type_id?: string;
  company_id: string;
}

interface CommitmentType {
  id: string;
  name: string;
  company_id: string;
}

const TransactionClassification: React.FC = () => {
  // State for transactions and data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [groups, setGroups] = useState<CommitmentGroup[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [types, setTypes] = useState<CommitmentType[]>([]);
  const [banks, setBanks] = useState<{ id: string; bank_name: string; bank_code: string }[]>([]);

  // Filtered options for cascading dropdowns
  const [filteredGroups, setFilteredGroups] = useState<CommitmentGroup[]>([]);
  const [filteredCommitments, setFilteredCommitments] = useState<Commitment[]>([]);

  // Filtered options for BULK cascading dropdowns
  const [bulkFilteredGroups, setBulkFilteredGroups] = useState<CommitmentGroup[]>([]);
  const [bulkFilteredCommitments, setBulkFilteredCommitments] = useState<Commitment[]>([]);

  // Loading and UI states
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("unclassified");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Bulk classification state
  const [bulkType, setBulkType] = useState("");
  const [bulkGroup, setBulkGroup] = useState("");
  const [bulkCommitment, setBulkCommitment] = useState("");

  // Rule dialog state
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ClassificationRule | null>(null);
  const [newRule, setNewRule] = useState({
    rule_name: "",
    description_contains: "",
    commitment_group_id: "",
    commitment_id: "",
    commitment_type_id: "",
    bank_id: "",
  });

  // Hierarchy state
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hasSearchedHierarchy, setHasSearchedHierarchy] = useState(false);
  const [hasSearchedRules, setHasSearchedRules] = useState(false);

  // Estados para controle de progresso da aplicação de regras
  const [isApplyingRules, setIsApplyingRules] = useState(false);
  const [progressStats, setProgressStats] = useState({
    total: 0,
    processed: 0,
    classified: 0,
    percentage: 0,
  });

  // Integration dialog states
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
  const [integrationYear, setIntegrationYear] = useState<number>(new Date().getFullYear());
  const [selectedIntegrationMonths, setSelectedIntegrationMonths] = useState<number[]>([]);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [includeQuarterAggregation, setIncludeQuarterAggregation] = useState(true);
  const [includeSemesterAggregation, setIncludeSemesterAggregation] = useState(true);
  const [includeYearAggregation, setIncludeYearAggregation] = useState(true);

  // Load hierarchy and rules on mount (not transactions)
  useEffect(() => {
    // Não carregar hierarquia nem regras automaticamente
    // fetchHierarchy() e fetchRules() serão chamados ao clicar em "Buscar"
    fetchAvailableYears();
    fetchBanks();
  }, []);

  // Carregar hierarquia automaticamente ao abrir o modal de nova regra
  useEffect(() => {
    if (isRuleDialogOpen && types.length === 0) {
      fetchHierarchy();
    }
  }, [isRuleDialogOpen]);

  // Carregar hierarquia automaticamente ao abrir o modal de editar regra
  useEffect(() => {
    if (isEditRuleDialogOpen && types.length === 0) {
      fetchHierarchy();
    }
  }, [isEditRuleDialogOpen]);

  // Reset page when filters change (but don't reload data)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroup, selectedStatus, selectedYear, selectedMonths]);

  // Reload data when pagination changes (only if data already loaded)
  useEffect(() => {
    if (transactions.length > 0 || totalItems > 0) {
      fetchData();
    }
  }, [currentPage, itemsPerPage]);

  // Filter groups based on selected type
  useEffect(() => {
    if (newRule.commitment_type_id) {
      // Find commitments that belong to the selected type
      const commitmentsOfType = commitments.filter((c) => c.commitment_type_id === newRule.commitment_type_id);

      // Extract unique group IDs from those commitments
      const groupIds = new Set(commitmentsOfType.map((c) => c.commitment_group_id));

      // Filter groups to show only those that have commitments of this type
      const filtered = groups.filter((g) => groupIds.has(g.id));
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups([]);
    }
  }, [newRule.commitment_type_id, commitments, groups]);

  // Filter commitments based on selected type AND group
  useEffect(() => {
    if (newRule.commitment_type_id && newRule.commitment_group_id) {
      const filtered = commitments.filter(
        (c) =>
          c.commitment_type_id === newRule.commitment_type_id && c.commitment_group_id === newRule.commitment_group_id,
      );
      setFilteredCommitments(filtered);
    } else {
      setFilteredCommitments([]);
    }
  }, [newRule.commitment_type_id, newRule.commitment_group_id, commitments]);

  // Filter bulk groups based on selected bulk type
  useEffect(() => {
    if (bulkType) {
      // Find commitments that belong to the selected type
      const commitmentsOfType = commitments.filter((c) => c.commitment_type_id === bulkType);

      // Extract unique group IDs from those commitments
      const groupIds = new Set(commitmentsOfType.map((c) => c.commitment_group_id));

      // Filter groups to show only those that have commitments of this type
      const filtered = groups.filter((g) => groupIds.has(g.id));
      setBulkFilteredGroups(filtered);
    } else {
      setBulkFilteredGroups([]);
    }
  }, [bulkType, commitments, groups]);

  // Filter bulk commitments based on selected bulk type AND bulk group
  useEffect(() => {
    if (bulkType && bulkGroup) {
      const filtered = commitments.filter(
        (c) => c.commitment_type_id === bulkType && c.commitment_group_id === bulkGroup,
      );
      setBulkFilteredCommitments(filtered);
    } else {
      setBulkFilteredCommitments([]);
    }
  }, [bulkType, bulkGroup, commitments]);

  // Real-time updates for transactions and classifications
  useEffect(() => {
    const channel = supabase
      .channel("classification-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchData();
          fetchAvailableYears();
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
          fetchData();
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
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Real-time updates for classification rules
  useEffect(() => {
    const rulesChannel = supabase
      .channel("classification-rules-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "classification_rules",
        },
        () => {
          fetchRules();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rulesChannel);
    };
  }, []);

  // Hierarchy functions
  const toggleType = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getFilteredHierarchy = () => {
    const filteredTypes = selectedTypeFilter === "all" ? types : types.filter((t) => t.id === selectedTypeFilter);

    // Create hierarchy: Type → Group → Commitment
    return filteredTypes
      .map((type) => {
        // Find commitments for this type - now using commitment_type_id
        const typeCommitments = commitments.filter((c) => c.commitment_type_id === type.id);

        // Group commitments by their groups
        const groupsForType = groups
          .filter((group) => typeCommitments.some((commitment) => commitment.commitment_group_id === group.id))
          .map((group) => ({
            ...group,
            commitments: typeCommitments.filter((c) => c.commitment_group_id === group.id),
          }));

        return {
          ...type,
          groups: groupsForType,
        };
      })
      .filter((type) => type.groups.length > 0); // Only show types that have groups/commitments
  };

  const fetchData = async () => {
    console.log("🚀 fetchData iniciado");
    console.log("📋 Filtros atuais:", {
      ano: selectedYear,
      meses: selectedMonths,
      status: selectedStatus,
      grupo: selectedGroup,
      termoBusca: searchTerm,
      pagina: currentPage,
      itensPorPagina: itemsPerPage,
    });

    try {
      setLoading(true);

      // Get user's company_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ Usuário não autenticado");
        toast({
          title: "Erro de autenticação",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();

      if (!profile?.company_id) {
        console.error("❌ Empresa não encontrada");
        toast({
          title: "Erro",
          description: "Empresa não encontrada para o usuário",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const companyId = profile.company_id;
      console.log("🏢 Company ID:", companyId);

      // Fetch all classifications for the company to use for filtering
      const { data: allClassifications } = await supabase
        .from("transaction_classifications")
        .select("transaction_id, commitment_group_id");

      const classifiedIdsSet = new Set(allClassifications?.map((c) => c.transaction_id) || []);

      // Build base query for transactions
      let baseQuery = supabase.from("transactions").select(`
          id,
          description,
          amount,
          transaction_date,
          transaction_type,
          memo,
          bank_id,
          company_id,
          balance,
          fitid,
          ofx_import_date,
          created_at,
          updated_at,
          banks (
            bank_name,
            bank_code
          )
        `);

      // Apply company filter - CRITICAL
      baseQuery = baseQuery.eq("company_id", companyId);

      // Apply text search filter
      if (searchTerm) {
        baseQuery = baseQuery.ilike("description", `%${searchTerm}%`);
      }

      // Apply date filters by year and months
      if (selectedYear && selectedMonths.length > 0) {
        // Buscar todas as transações do ano selecionado
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        baseQuery = baseQuery
          .gte("transaction_date", format(yearStart, "yyyy-MM-dd"))
          .lte("transaction_date", format(yearEnd, "yyyy-MM-dd"));
      }

      // Fetch ALL transactions matching the base filters (no pagination yet)
      const { data: allTransactionsData, error: allTransactionsError } = await baseQuery
        .limit(10000)
        .order("transaction_date", {
          ascending: false,
        });

      if (allTransactionsError) {
        console.error("❌ Erro ao buscar transações:", allTransactionsError);
        toast({
          title: "Erro ao buscar transações",
          description: allTransactionsError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("📊 Transações brutas do banco:", allTransactionsData?.length || 0);

      // Apply status and group filters in memory
      let filteredTransactions = allTransactionsData || [];

      // Apply month filter (filtra pelos meses selecionados)
      if (selectedYear && selectedMonths.length > 0) {
        const beforeFilter = filteredTransactions.length;
        filteredTransactions = filteredTransactions.filter((t) => {
          const transactionDate = new Date(t.transaction_date);
          const transactionMonth = transactionDate.getMonth() + 1; // getMonth() retorna 0-11
          return selectedMonths.includes(transactionMonth);
        });
        console.log(
          `📆 Após filtro de meses (${selectedMonths.join(", ")}): ${beforeFilter} → ${filteredTransactions.length} transações`,
        );
      }

      // Apply status filter
      if (selectedStatus === "classified") {
        const beforeFilter = filteredTransactions.length;
        filteredTransactions = filteredTransactions.filter((t) => classifiedIdsSet.has(t.id));
        console.log(
          `🏷️ Após filtro de status (classificadas): ${beforeFilter} → ${filteredTransactions.length} transações`,
        );
      } else if (selectedStatus === "unclassified") {
        const beforeFilter = filteredTransactions.length;
        filteredTransactions = filteredTransactions.filter((t) => !classifiedIdsSet.has(t.id));
        console.log(
          `🏷️ Após filtro de status (não classificadas): ${beforeFilter} → ${filteredTransactions.length} transações`,
        );
      }

      // Apply group filter
      if (selectedGroup !== "all") {
        const beforeFilter = filteredTransactions.length;
        const groupClassifiedIds = new Set(
          allClassifications?.filter((c) => c.commitment_group_id === selectedGroup).map((c) => c.transaction_id) || [],
        );
        filteredTransactions = filteredTransactions.filter((t) => groupClassifiedIds.has(t.id));
        console.log(`📊 Após filtro de grupo: ${beforeFilter} → ${filteredTransactions.length} transações`);
      }

      console.log(`✅ Total após todos os filtros: ${filteredTransactions.length} transações`);

      // Set total count after filtering
      setTotalItems(filteredTransactions.length);

      // Apply pagination to filtered results
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage;
      const paginatedTransactions = filteredTransactions.slice(from, to);

      // Fetch classifications for the paginated transactions
      const transactionIds = paginatedTransactions.map((t) => t.id);

      console.log(
        `📄 Paginação: página ${currentPage}, exibindo ${transactionIds.length} de ${filteredTransactions.length} transações`,
      );

      if (transactionIds.length === 0) {
        console.log("⚠️ Nenhuma transação encontrada após filtros e paginação");
        setTransactions([]);
        setLoading(false);

        // Mostrar mensagem informativa ao usuário
        const monthNames = selectedMonths
          .map((m) => {
            const date = new Date(selectedYear, m - 1, 1);
            return format(date, "MMMM", { locale: ptBR });
          })
          .join(", ");

        toast({
          title: "Nenhuma transação encontrada",
          description: `Não foram encontradas transações para ${monthNames} de ${selectedYear} com os filtros aplicados. Tente ajustar os filtros ou selecionar outro período.`,
          variant: "default",
        });
        return;
      }

      const { data: classificationsData, error: classificationsError } = await supabase
        .from("transaction_classifications")
        .select(
          `
          transaction_id,
          commitment_group_id,
          commitment_id,
          commitment_type_id,
          commitment_groups (
            id,
            name,
            color
          ),
          commitments (
            id,
            name
          ),
          commitment_types (
            id,
            name
          )
        `,
        )
        .in("transaction_id", transactionIds);

      if (classificationsError) {
        console.error("Error fetching classifications:", classificationsError);
      }

      // Create a map of classifications by transaction_id
      const classificationsMap = new Map();
      classificationsData?.forEach((classification) => {
        classificationsMap.set(classification.transaction_id, {
          id: classification.transaction_id,
          group_name: classification.commitment_groups?.name || "",
          group_color: classification.commitment_groups?.color || "#6B7280",
          commitment_name: classification.commitments?.name || "",
          type_name: classification.commitment_types?.name || "",
        });
      });

      // Transform data to include classification info
      const transformedTransactions = paginatedTransactions.map((transaction: any) => ({
        ...transaction,
        transaction_type: transaction.transaction_type as "credit" | "debit",
        bank: transaction.banks || null,
        classification: classificationsMap.get(transaction.id) || null,
      }));

      setTransactions(transformedTransactions);
      console.log("✅ fetchData concluído com sucesso:", transformedTransactions.length, "transações carregadas");
    } catch (error) {
      console.error("❌ Erro inesperado em fetchData:", error);
      toast({
        title: "Erro ao buscar transações",
        description: error instanceof Error ? error.message : "Erro desconhecido ao buscar transações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("🏁 fetchData finalizado, loading=false");
    }
  };

  const handleSearch = () => {
    console.log("🔍 handleSearch chamado");
    console.log("📅 Ano selecionado:", selectedYear);
    console.log("📆 Meses selecionados:", selectedMonths);
    console.log("🏷️ Status selecionado:", selectedStatus);
    console.log("📊 Grupo selecionado:", selectedGroup);
    console.log("🔎 Termo de busca:", searchTerm);

    // Validar se há meses selecionados
    if (selectedMonths.length === 0) {
      console.log("⚠️ Nenhum mês selecionado - mostrando toast");
      toast({
        title: "Meses obrigatórios",
        description: "Por favor, selecione pelo menos um mês para buscar as movimentações.",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Validação OK - chamando fetchData()");
    setCurrentPage(1);
    fetchData();
  };

  const fetchHierarchy = async () => {
    try {
      // Fetch commitment groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("commitment_groups")
        .select("*")
        .eq("is_active", true);

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Fetch commitments
      const { data: commitmentsData, error: commitmentsError } = await supabase
        .from("commitments")
        .select("*")
        .eq("is_active", true);

      if (commitmentsError) throw commitmentsError;
      setCommitments(commitmentsData || []);

      // Fetch commitment types
      const { data: typesData, error: typesError } = await supabase
        .from("commitment_types")
        .select("*")
        .eq("is_active", true);

      if (typesError) throw typesError;
      setTypes(typesData || []);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
    }
  };

  const handleSearchHierarchy = async () => {
    setHasSearchedHierarchy(true);
    await fetchHierarchy();
  };

  const handleSearchRules = async () => {
    setHasSearchedRules(true);
    await fetchRules();
  };

  const fetchAvailableYears = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("transaction_date")
        .eq("company_id", profile.company_id)
        .order("transaction_date", { ascending: false });

      if (error) {
        console.error("Error fetching available years:", error);
        return;
      }

      if (data && data.length > 0) {
        const years = Array.from(new Set(data.map((item) => new Date(item.transaction_date).getFullYear()))).sort(
          (a, b) => b - a,
        );

        setAvailableYears(years);

        if (years.length > 0 && !years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }

        if (years.length > 0 && !years.includes(integrationYear)) {
          setIntegrationYear(years[0]);
        }
      } else {
        setAvailableYears([new Date().getFullYear()]);
      }
    } catch (error) {
      console.error("Error in fetchAvailableYears:", error);
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const fetchBanks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from("banks")
        .select("id, bank_name, bank_code")
        .eq("company_id", profile.company_id)
        .order("bank_name");

      if (error) throw error;

      setBanks(data || []);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const fetchRules = async () => {
    try {
      // Get user's company_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();

      if (!profile?.company_id) return;

      const companyId = profile.company_id;

      // Fetch classification rules for the company
      const { data: rulesData, error: rulesError } = await supabase
        .from("classification_rules")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (rulesError) {
        console.error("Error fetching rules:", rulesError);
      } else {
        setRules(rulesData || []);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    }
  };

  const handleClassifyTransaction = async (transactionId: string, groupId: string, commitmentId: string) => {
    try {
      // If all are empty, delete the classification
      if (!groupId && !commitmentId) {
        const { error } = await supabase
          .from("transaction_classifications")
          .delete()
          .eq("transaction_id", transactionId);

        if (error) throw error;
      } else {
        // Validar se todos os campos estão preenchidos
        if (!groupId || !commitmentId) {
          toast({
            title: "Classificação incompleta",
            description: "Por favor, selecione o grupo e a natureza para classificar a transação.",
            variant: "destructive",
          });
          return;
        }

        // Get the commitment type from the selected commitment
        const commitment = commitments.find((c) => c.id === commitmentId);
        const typeId = commitment?.commitment_type_id;

        // Validar se o tipo existe
        if (!typeId) {
          toast({
            title: "Erro na classificação",
            description: "Tipo de natureza não encontrado para esta natureza.",
            variant: "destructive",
          });
          return;
        }

        // Upsert the classification
        const { error } = await supabase.from("transaction_classifications").upsert({
          transaction_id: transactionId,
          commitment_group_id: groupId,
          commitment_id: commitmentId,
          commitment_type_id: typeId,
          classified_by: (await supabase.auth.getUser()).data.user?.id,
        });

        if (error) throw error;
      }

      // Refresh the data
      await fetchData();

      toast({
        title: "Classificação atualizada",
        description: "A movimentação foi classificada com sucesso",
      });
    } catch (error) {
      console.error("Error classifying transaction:", error);
      toast({
        title: "Erro na classificação",
        description: "Não foi possível classificar a movimentação",
        variant: "destructive",
      });
    }
  };

  const handleBulkClassify = async () => {
    if (!bulkType || !bulkGroup || !bulkCommitment) {
      toast({
        title: "Seleção inválida",
        description: "Selecione o tipo, grupo e a natureza",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Starting bulk classification:", {
        selectedTransactions,
        bulkType,
        bulkGroup,
        bulkCommitment,
      });

      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Process each selected transaction
      for (const transactionId of selectedTransactions) {
        // First, delete any existing classification
        const { error: deleteError } = await supabase
          .from("transaction_classifications")
          .delete()
          .eq("transaction_id", transactionId);

        if (deleteError) {
          console.error("Error deleting existing classification:", deleteError);
        }

        // Then insert the new classification
        const { error: insertError } = await supabase.from("transaction_classifications").insert({
          transaction_id: transactionId,
          commitment_group_id: bulkGroup || null,
          commitment_id: bulkCommitment || null,
          commitment_type_id: bulkType || null,
          classified_by: userId,
        });

        if (insertError) {
          console.error("Error inserting classification:", insertError);
          throw insertError;
        }
      }

      console.log("Bulk classification completed successfully");

      // Clear selections and refresh data
      setSelectedTransactions([]);
      setBulkType("");
      setBulkGroup("");
      setBulkCommitment("");

      // Force refresh with a small delay to ensure data is updated
      setTimeout(() => {
        fetchData();
      }, 500);

      toast({
        title: "Classificação em lote concluída",
        description: `${selectedTransactions.length} movimentações foram classificadas`,
      });
    } catch (error) {
      console.error("Error bulk classifying:", error);
      toast({
        title: "Erro na classificação em lote",
        description: "Não foi possível classificar as movimentações",
        variant: "destructive",
      });
    }
  };

  const handleBulkRemoveClassification = async () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "Nenhuma movimentação selecionada",
        description: "Selecione pelo menos uma movimentação",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete all classifications for selected transactions
      const { error } = await supabase
        .from("transaction_classifications")
        .delete()
        .in("transaction_id", selectedTransactions);

      if (error) throw error;

      // Clear selection
      setSelectedTransactions([]);

      // Refresh data
      await fetchData();

      toast({
        title: "Classificações removidas",
        description: `${selectedTransactions.length} classificações foram removidas com sucesso`,
      });
    } catch (error) {
      console.error("Error removing bulk classifications:", error);
      toast({
        title: "Erro ao remover classificações",
        description: "Não foi possível remover as classificações",
        variant: "destructive",
      });
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.rule_name || !newRule.description_contains) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o nome da regra e a descrição",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get user's company_id from profile
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
          description: "Empresa não encontrada",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("classification_rules").insert({
        ...newRule,
        company_id: profile.company_id,
        commitment_group_id: newRule.commitment_group_id || null,
        commitment_id: newRule.commitment_id || null,
        commitment_type_id: newRule.commitment_type_id || null,
      });

      if (error) throw error;

      await fetchRules();
      setIsRuleDialogOpen(false);
      setNewRule({
        rule_name: "",
        description_contains: "",
        commitment_group_id: "",
        commitment_id: "",
        commitment_type_id: "",
        bank_id: "",
      });

      toast({
        title: "Regra criada",
        description: "A regra de classificação foi criada com sucesso",
      });
    } catch (error) {
      console.error("Error creating rule:", error);
      toast({
        title: "Erro ao criar regra",
        description: "Não foi possível criar a regra",
        variant: "destructive",
      });
    }
  };

  const handleEditRule = (rule: ClassificationRule) => {
    setEditingRule(rule);
    setNewRule({
      rule_name: rule.rule_name,
      description_contains: rule.description_contains,
      commitment_group_id: rule.commitment_group_id || "",
      commitment_id: rule.commitment_id || "",
      commitment_type_id: rule.commitment_type_id || "",
      bank_id: rule.bank_id || "",
    });
    setIsEditRuleDialogOpen(true);
  };

  const handleUpdateRule = async () => {
    if (!editingRule || !newRule.rule_name || !newRule.description_contains) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o nome da regra e a descrição",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("classification_rules")
        .update({
          rule_name: newRule.rule_name,
          description_contains: newRule.description_contains,
          commitment_group_id: newRule.commitment_group_id || null,
          commitment_id: newRule.commitment_id || null,
          commitment_type_id: newRule.commitment_type_id || null,
          bank_id: newRule.bank_id || null,
        })
        .eq("id", editingRule.id);

      if (error) throw error;

      await fetchRules();
      setIsEditRuleDialogOpen(false);
      setEditingRule(null);
      setNewRule({
        rule_name: "",
        description_contains: "",
        commitment_group_id: "",
        commitment_id: "",
        commitment_type_id: "",
        bank_id: "",
      });

      toast({
        title: "Regra atualizada",
        description: "A regra foi atualizada com sucesso",
      });
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        title: "Erro ao atualizar regra",
        description: "Não foi possível atualizar a regra",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) {
      return;
    }

    try {
      const { error } = await supabase.from("classification_rules").delete().eq("id", ruleId);

      if (error) throw error;

      await fetchRules();

      toast({
        title: "Regra excluída",
        description: "A regra foi excluída com sucesso",
      });
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: "Erro ao excluir regra",
        description: "Não foi possível excluir a regra",
        variant: "destructive",
      });
    }
  };

  const applyAutomaticClassification = async () => {
    // Validar se há meses selecionados
    if (selectedMonths.length === 0) {
      toast({
        title: "Meses obrigatórios",
        description: "Por favor, selecione pelo menos um mês antes de aplicar as regras.",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingRules(true);
    setProgressStats({ total: 0, processed: 0, classified: 0, percentage: 0 });

    try {
      const batchSize = 100;

      // Get company_id first
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();

      if (!profile?.company_id) throw new Error("Company not found");

      // Get filtered transactions (same filters as fetchData)
      let query = supabase
        .from("transactions")
        .select("id, description, transaction_date")
        .eq("company_id", profile.company_id);

      // Apply the same filters as fetchData
      if (searchTerm) {
        query = query.ilike("description", `%${searchTerm}%`);
      }

      // Apply date filters by year and months
      if (selectedYear && selectedMonths.length > 0) {
        // Buscar todas as transações do ano selecionado
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        query = query
          .gte("transaction_date", format(yearStart, "yyyy-MM-dd"))
          .lte("transaction_date", format(yearEnd, "yyyy-MM-dd"));
      }

      const { data: allTransactions, error: transactionsError } = await query;

      if (transactionsError) {
        throw transactionsError;
      }

      // Filtrar pelos meses selecionados no lado do cliente
      let filteredTransactions = allTransactions || [];
      if (selectedYear && selectedMonths.length > 0 && filteredTransactions.length > 0) {
        filteredTransactions = filteredTransactions.filter((t: any) => {
          const transactionDate = new Date(t.transaction_date);
          const transactionMonth = transactionDate.getMonth() + 1;
          return selectedMonths.includes(transactionMonth);
        });
      }

      if (!filteredTransactions || filteredTransactions.length === 0) {
        toast({
          title: "Nenhuma transação encontrada",
          description: "Não há transações para classificar",
        });
        setIsApplyingRules(false);
        return;
      }

      // Get ALL existing classifications for this company
      const { data: existingClassifications, error: classificationsError } = await supabase
        .from("transaction_classifications")
        .select("transaction_id");

      if (classificationsError) {
        throw classificationsError;
      }

      const classifiedIds = new Set(existingClassifications?.map((c) => c.transaction_id) || []);
      const unclassifiedTransactions = filteredTransactions.filter((t: any) => !classifiedIds.has(t.id));

      if (unclassifiedTransactions.length === 0) {
        toast({
          title: "Todas as transações já estão classificadas",
          description: "Não há transações não classificadas para processar",
        });
        setIsApplyingRules(false);
        return;
      }

      // Inicializar progresso
      setProgressStats({
        total: unclassifiedTransactions.length,
        processed: 0,
        classified: 0,
        percentage: 0,
      });

      let totalClassified = 0;
      const classificationsToInsert = [];

      // Process transactions in batches
      for (let i = 0; i < unclassifiedTransactions.length; i += batchSize) {
        const batch = unclassifiedTransactions.slice(i, i + batchSize);

        for (const transaction of batch) {
          for (const rule of rules) {
            if (transaction.description.toLowerCase().includes(rule.description_contains.toLowerCase())) {
              // Pegar commitment_type_id do commitment
              let typeId = rule.commitment_type_id;
              if (rule.commitment_id && !typeId) {
                const commitment = commitments.find((c) => c.id === rule.commitment_id);
                typeId = commitment?.commitment_type_id || null;
              }

              classificationsToInsert.push({
                transaction_id: transaction.id,
                commitment_group_id: rule.commitment_group_id || null,
                commitment_id: rule.commitment_id || null,
                commitment_type_id: typeId,
                classified_by: user.id,
              });

              totalClassified++;
              break; // Aplicar apenas a primeira regra que bater
            }
          }

          // Atualizar progresso
          const processed = i + batch.indexOf(transaction) + 1;
          const percentage = Math.round((processed / unclassifiedTransactions.length) * 100);

          setProgressStats({
            total: unclassifiedTransactions.length,
            processed,
            classified: totalClassified,
            percentage,
          });
        }

        // Inserir classificações do batch
        if (classificationsToInsert.length > 0) {
          const batchToInsert = classificationsToInsert.splice(0, classificationsToInsert.length);
          const { error: insertError } = await supabase.from("transaction_classifications").insert(batchToInsert);

          if (insertError) {
            console.error("Error inserting classifications:", insertError);
          }
        }

        // Pequeno delay para atualizar UI
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Refresh data UMA ÚNICA VEZ no final
      await fetchData();

      const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];
      const selectedMonthNames = selectedMonths.map((m) => monthNames[m - 1]).join(", ");
      const periodText = selectedMonths.length > 0 ? ` para ${selectedMonthNames} de ${selectedYear}` : "";

      toast({
        title: "Classificação automática concluída",
        description: `${totalClassified} movimentações foram classificadas automaticamente de um total de ${unclassifiedTransactions.length} transações processadas${periodText}`,
      });
    } catch (error) {
      console.error("Error applying automatic classification:", error);
      toast({
        title: "Erro na classificação automática",
        description: "Não foi possível aplicar as regras",
        variant: "destructive",
      });
    } finally {
      setIsApplyingRules(false);
      setProgressStats({ total: 0, processed: 0, classified: 0, percentage: 0 });
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

    // Get company ID
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

    // Helper functions para cálculo de período
    const getQuarter = (month: number): number => {
      return Math.floor((month - 1) / 3) + 1;
    };

    const getSemester = (month: number): number => {
      return month <= 6 ? 1 : 2;
    };

    try {
      // Coletar todas as transações classificadas do ano para agregações multi-nível
      const yearStartDate = new Date(integrationYear, 0, 1);
      const yearEndDate = new Date(integrationYear, 11, 31);

      // Buscar TODAS as transações do ano (para agregações de trimestre, semestre e ano)
      const { data: allYearTransactions, error: yearFetchError } = await supabase
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
        .gte("transactions.transaction_date", format(yearStartDate, "yyyy-MM-dd"))
        .lte("transactions.transaction_date", format(yearEndDate, "yyyy-MM-dd"));

      if (yearFetchError) {
        console.error("Error fetching year transactions:", yearFetchError);
        throw yearFetchError;
      }

      // Estrutura para armazenar agregações multi-nível
      const multiLevelAggregations = {
        month: new Map<string, any>(),
        quarter: new Map<string, any>(),
        semester: new Map<string, any>(),
        year: new Map<string, any>(),
      };

      // Processar cada transação e agregar em todos os níveis necessários
      for (const item of allYearTransactions || []) {
        // Validar classificação completa
        if (!item.commitment_types?.name || !item.commitment_groups?.name || !item.commitments?.name) {
          console.warn(`Ignorando transação com classificação incompleta`);
          continue;
        }

        const transactionDate = new Date(item.transactions.transaction_date);
        const transactionMonth = transactionDate.getMonth() + 1;
        const transactionYear = transactionDate.getFullYear();

        const quarter = getQuarter(transactionMonth);
        const semester = getSemester(transactionMonth);

        const commitmentKey = `${item.commitment_type_id}_${item.commitment_group_id}_${item.commitment_id}`;

        const amount =
          item.transactions.transaction_type === "credit"
            ? Math.abs(Number(item.transactions.amount))
            : -Math.abs(Number(item.transactions.amount));

        // Helper para criar/atualizar agregação
        const updateAggregation = (map: Map<string, any>, key: string) => {
          if (!map.has(key)) {
            map.set(key, {
              commitment_type_id: item.commitment_type_id,
              commitment_group_id: item.commitment_group_id,
              commitment_id: item.commitment_id,
              type_name: item.commitment_types.name,
              group_name: item.commitment_groups.name,
              commitment_name: item.commitments.name,
              total_amount: 0,
              transaction_count: 0,
            });
          }
          const agg = map.get(key)!;
          agg.total_amount += amount;
          agg.transaction_count += 1;
        };

        // Agregar em MESES (apenas para meses selecionados)
        if (selectedIntegrationMonths.includes(transactionMonth)) {
          const monthKey = `${format(transactionDate, "yyyy-MM")}_${commitmentKey}`;
          updateAggregation(multiLevelAggregations.month, monthKey);
        }

        // Agregar em TRIMESTRES (se toggle ativo)
        if (includeQuarterAggregation) {
          const quarterKey = `${transactionYear}-Q${quarter}_${commitmentKey}`;
          updateAggregation(multiLevelAggregations.quarter, quarterKey);
        }

        // Agregar em SEMESTRES (se toggle ativo)
        if (includeSemesterAggregation) {
          const semesterKey = `${transactionYear}-S${semester}_${commitmentKey}`;
          updateAggregation(multiLevelAggregations.semester, semesterKey);
        }

        // Agregar em ANO (se toggle ativo)
        if (includeYearAggregation) {
          const yearKey = `${transactionYear}_${commitmentKey}`;
          updateAggregation(multiLevelAggregations.year, yearKey);
        }
      }

      // Preparar dados para upsert em cada nível
      const allIntegrationsToInsert: any[] = [];

      // MESES
      for (const [key, agg] of multiLevelAggregations.month.entries()) {
        const [periodKey] = key.split("_");
        const monthYearKey = `${periodKey}-01`; // Para compatibilidade com month_year

        allIntegrationsToInsert.push({
          company_id: companyId,
          month_year: monthYearKey,
          aggregation_type: "month" as const,
          period_key: periodKey,
          commitment_type_id: agg.commitment_type_id,
          commitment_group_id: agg.commitment_group_id,
          commitment_id: agg.commitment_id,
          type_name: agg.type_name,
          group_name: agg.group_name,
          commitment_name: agg.commitment_name,
          total_amount: agg.total_amount,
          transaction_count: agg.transaction_count,
        });
      }

      // TRIMESTRES
      for (const [key, agg] of multiLevelAggregations.quarter.entries()) {
        const [periodKey] = key.split("_");
        const [year, quarter] = periodKey.split("-");
        const monthYearKey = `${year}-${String((parseInt(quarter.replace("Q", "")) - 1) * 3 + 1).padStart(2, "0")}-01`;

        allIntegrationsToInsert.push({
          company_id: companyId,
          month_year: monthYearKey,
          aggregation_type: "quarter" as const,
          period_key: periodKey,
          commitment_type_id: agg.commitment_type_id,
          commitment_group_id: agg.commitment_group_id,
          commitment_id: agg.commitment_id,
          type_name: agg.type_name,
          group_name: agg.group_name,
          commitment_name: agg.commitment_name,
          total_amount: agg.total_amount,
          transaction_count: agg.transaction_count,
        });
      }

      // SEMESTRES
      for (const [key, agg] of multiLevelAggregations.semester.entries()) {
        const [periodKey] = key.split("_");
        const [year, semester] = periodKey.split("-");
        const monthYearKey = `${year}-${semester.replace("S", "") === "1" ? "01" : "07"}-01`;

        allIntegrationsToInsert.push({
          company_id: companyId,
          month_year: monthYearKey,
          aggregation_type: "semester" as const,
          period_key: periodKey,
          commitment_type_id: agg.commitment_type_id,
          commitment_group_id: agg.commitment_group_id,
          commitment_id: agg.commitment_id,
          type_name: agg.type_name,
          group_name: agg.group_name,
          commitment_name: agg.commitment_name,
          total_amount: agg.total_amount,
          transaction_count: agg.transaction_count,
        });
      }

      // ANO
      for (const [key, agg] of multiLevelAggregations.year.entries()) {
        const [periodKey] = key.split("_");
        const monthYearKey = `${periodKey}-01-01`;

        allIntegrationsToInsert.push({
          company_id: companyId,
          month_year: monthYearKey,
          aggregation_type: "year" as const,
          period_key: periodKey,
          commitment_type_id: agg.commitment_type_id,
          commitment_group_id: agg.commitment_group_id,
          commitment_id: agg.commitment_id,
          type_name: agg.type_name,
          group_name: agg.group_name,
          commitment_name: agg.commitment_name,
          total_amount: agg.total_amount,
          transaction_count: agg.transaction_count,
        });
      }

      // Fazer upsert de TODAS as agregações de uma vez
      if (allIntegrationsToInsert.length > 0) {
        const { error: upsertError } = await supabase.from("integrated_transactions").upsert(allIntegrationsToInsert, {
          onConflict: "company_id,period_key,aggregation_type,commitment_type_id,commitment_group_id,commitment_id",
          ignoreDuplicates: false,
        });

        if (upsertError) {
          console.error("Error upserting integrations:", upsertError);
          throw upsertError;
        }

        console.log(`✅ Integrated ${allIntegrationsToInsert.length} total records`);
      }

      // Mensagem de sucesso
      const aggregationTypes: string[] = ["meses"];
      if (includeQuarterAggregation) aggregationTypes.push("trimestres");
      if (includeSemesterAggregation) aggregationTypes.push("semestres");
      if (includeYearAggregation) aggregationTypes.push("ano");

      toast({
        title: "Integração concluída",
        description: `Dados agregados por: ${aggregationTypes.join(", ")}. Total de ${allIntegrationsToInsert.length} registros integrados.`,
      });

      // Fechar modal e limpar seleção
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

  const exportToCSV = () => {
    const headers = ["Data", "Descrição", "Valor", "Tipo", "Grupo", "Natureza", "Tipo de Natureza"];
    const csvData = transactions.map((transaction) => [
      format(parseISO(transaction.transaction_date), "dd/MM/yyyy"),
      transaction.description,
      transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      transaction.transaction_type === "credit" ? "Crédito" : "Débito",
      transaction.classification?.group_name || "Não classificado",
      transaction.classification?.commitment_name || "",
      transaction.classification?.type_name || "",
    ]);

    const csvString = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `classificacao_movimentos_${format(new Date(), "dd-MM-yyyy")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Summary statistics state
  const [summaryStats, setSummaryStats] = useState({
    totalCredits: 0,
    totalDebits: 0,
    classificationPercentage: 0,
    totalTransactionsCount: 0,
  });

  // Fetch summary statistics
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Get company ID first
        const { data: companies } = await supabase.from("companies").select("id").limit(1);

        if (!companies || companies.length === 0) return;

        const companyId = companies[0].id;

        // Build query with same filters as main query
        let query = supabase
          .from("transactions")
          .select("amount, transaction_type, id, description, transaction_date")
          .eq("company_id", companyId);

        // Apply the same filters as fetchData
        if (searchTerm) {
          query = query.ilike("description", `%${searchTerm}%`);
        }

        // Apply date filters by year and months
        if (selectedYear && selectedMonths.length > 0) {
          // Buscar todas as transações do ano selecionado
          const yearStart = new Date(selectedYear, 0, 1);
          const yearEnd = new Date(selectedYear, 11, 31);
          query = query
            .gte("transaction_date", format(yearStart, "yyyy-MM-dd"))
            .lte("transaction_date", format(yearEnd, "yyyy-MM-dd"));
        }

        const { data: allTransactions, error } = await query.limit(100000);

        if (error) {
          console.error("Error fetching summary data:", error);
          return;
        }

        // Filtrar pelos meses selecionados no lado do cliente
        let filteredTransactions = allTransactions || [];
        if (selectedYear && selectedMonths.length > 0) {
          filteredTransactions = filteredTransactions.filter((t) => {
            const transactionDate = new Date(t.transaction_date);
            const transactionMonth = transactionDate.getMonth() + 1;
            return selectedMonths.includes(transactionMonth);
          });
        }

        // Get classifications count for filtered transactions
        const transactionIds = filteredTransactions?.map((t) => t.id) || [];
        let classificationQuery = supabase
          .from("transaction_classifications")
          .select("transaction_id", { count: "exact", head: true });

        if (transactionIds.length > 0) {
          classificationQuery = classificationQuery.in("transaction_id", transactionIds);
        }

        const { count: classifiedCount } = await classificationQuery;

        // Calculate totals

        const totalTransactionsCount = filteredTransactions?.length || 0;
        const classificationPercentage =
          totalTransactionsCount > 0 ? ((classifiedCount || 0) / totalTransactionsCount) * 100 : 0;

        const totalCredits = filteredTransactions?.filter((t) => t.transaction_type === "credit").length || 0;

        const totalDebits = filteredTransactions?.filter((t) => t.transaction_type === "debit").length || 0;

        setSummaryStats({
          totalCredits,
          totalDebits,
          classificationPercentage,
          totalTransactionsCount,
        });
      } catch (error) {
        console.error("Error calculating summary:", error);
      }
    };

    fetchSummary();
  }, [searchTerm, selectedYear, selectedMonths]);

  // Filter transactions - now just for display since server-side filtering is done
  const filteredTransactions = transactions;

  // Componente de Progress Overlay
  const ProgressOverlay = () => {
    if (!isApplyingRules) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <Card className="w-96 p-6 space-y-4">
          <div className="text-center space-y-2">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-semibold">Aplicando Regras de Classificação</h3>
            <p className="text-sm text-muted-foreground">Processando movimentações... Por favor, aguarde.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span className="font-semibold">{progressStats.percentage}%</span>
            </div>
            <Progress value={progressStats.percentage} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{progressStats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{progressStats.processed}</p>
              <p className="text-xs text-muted-foreground">Processadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{progressStats.classified}</p>
              <p className="text-xs text-muted-foreground">Classificadas</p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Overlay */}
      <ProgressOverlay />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova Regra de Classificação Automática</DialogTitle>
                  <DialogDescription>
                    Crie uma regra para classificação automática baseada na descrição da movimentação
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rule-name">Nome da Regra</Label>
                    <Input
                      id="rule-name"
                      value={newRule.rule_name}
                      onChange={(e) => setNewRule((prev) => ({ ...prev, rule_name: e.target.value }))}
                      placeholder="Ex: Pagamentos com cartão VISA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description-contains">Descrição contém</Label>
                    <Input
                      id="description-contains"
                      value={newRule.description_contains}
                      onChange={(e) => setNewRule((prev) => ({ ...prev, description_contains: e.target.value }))}
                      placeholder="Ex: VISA"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bank-select">Banco (opcional)</Label>
                    <Select
                      value={newRule.bank_id || "all"}
                      onValueChange={(value) => 
                        setNewRule((prev) => ({ ...prev, bank_id: value === "all" ? "" : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os bancos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os bancos</SelectItem>
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.bank_name} ({bank.bank_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se selecionado, a regra só será aplicada às transações deste banco
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Classificação</Label>
                    <div className="space-y-4">
                      {/* NEW: Select Tipo de Natureza */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Tipo de Natureza</Label>
                        <Select
                          value={newRule.commitment_type_id}
                          onValueChange={(value) => {
                            setNewRule((prev) => ({
                              ...prev,
                              commitment_type_id: value,
                              commitment_group_id: "",
                              commitment_id: "",
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de natureza" />
                          </SelectTrigger>
                          <SelectContent>
                            {types.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* MODIFIED: Grupo now filtered by Type */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Grupo de Natureza</Label>
                        <Select
                          value={newRule.commitment_group_id}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({
                              ...prev,
                              commitment_group_id: value,
                              commitment_id: "",
                            }))
                          }
                          disabled={!newRule.commitment_type_id}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !newRule.commitment_type_id
                                  ? "Selecione primeiro o tipo"
                                  : "Selecione o grupo de natureza"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredGroups.length === 0 && newRule.commitment_type_id ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Nenhum grupo disponível para este tipo
                              </div>
                            ) : (
                              filteredGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full border-2"
                                      style={{ borderColor: group.color, backgroundColor: `${group.color}20` }}
                                    />
                                    {group.name}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* MODIFIED: Natureza now filtered by Type AND Group */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Natureza</Label>
                        <Select
                          value={newRule.commitment_id}
                          onValueChange={(value) => {
                            setNewRule((prev) => ({
                              ...prev,
                              commitment_id: value,
                            }));
                          }}
                          disabled={!newRule.commitment_group_id}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !newRule.commitment_type_id
                                  ? "Selecione primeiro o tipo"
                                  : !newRule.commitment_group_id
                                    ? "Selecione primeiro o grupo"
                                    : "Selecione a natureza"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCommitments.length === 0 && newRule.commitment_group_id ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Nenhuma natureza disponível para este grupo e tipo
                              </div>
                            ) : (
                              filteredCommitments.map((commitment) => (
                                <SelectItem key={commitment.id} value={commitment.id}>
                                  {commitment.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleCreateRule} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Regra
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={applyAutomaticClassification}
              variant="outline"
              size="sm"
              disabled={isApplyingRules || loading}
            >
              {isApplyingRules ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando Regras...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Aplicar Regras
                </>
              )}
            </Button>

            <Button onClick={exportToCSV} variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar
            </Button>

            <Dialog
              open={isIntegrationDialogOpen}
              onOpenChange={(open) => {
                setIsIntegrationDialogOpen(open);
                if (open) {
                  fetchAvailableYears();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Integração
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Integração de Dados</DialogTitle>
                  <DialogDescription>
                    Selecione os meses para consolidar as transações classificadas por Tipo, Grupo e Natureza
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Aviso sobre o processo */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                    <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">ℹ️ Como funciona</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Os valores serão agregados por <strong>Tipo → Grupo → Natureza</strong> para cada mês selecionado.
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Se você integrar novamente o mesmo mês, os valores anteriores serão <strong>substituídos</strong>.
                    </p>
                  </div>

                  {/* Ano */}
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
                        {availableYears.length > 0 ? (
                          availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={new Date().getFullYear().toString()}>
                            {new Date().getFullYear()}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Agregações adicionais */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Agregações adicionais</label>
                    <div className="space-y-2 bg-muted/30 p-3 rounded-md border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Agregação por Trimestre</span>
                        </div>
                        <Switch checked={includeQuarterAggregation} onCheckedChange={setIncludeQuarterAggregation} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Agregação por Semestre</span>
                        </div>
                        <Switch checked={includeSemesterAggregation} onCheckedChange={setIncludeSemesterAggregation} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Agregação Anual</span>
                        </div>
                        <Switch checked={includeYearAggregation} onCheckedChange={setIncludeYearAggregation} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Além dos meses individuais, você pode incluir agregações consolidadas
                    </p>
                  </div>

                  {/* Meses */}
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

                  {/* Resumo */}
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

        <Tabs defaultValue="movements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="hierarchy">Hierarquia</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="space-y-6">
            {/* Summary Cards */}
            {/*<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Créditos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {summaryStats.totalCredits || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Débitos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {summaryStats.totalDebits || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Movimentações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summaryStats.totalTransactionsCount || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Classificação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summaryStats.classificationPercentage.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>*/}

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Linha 1: Busca, Grupo, Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="relative md:col-span-2 lg:col-span-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="lg:col-span-2">
                      <SelectValue placeholder="Grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os grupos</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="lg:col-span-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="classified">Classificados</SelectItem>
                      <SelectItem value="unclassified">Não classificados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Separador visual */}
                <Separator />

                {/* Linha 2: Ano e Meses */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium min-w-[60px]">Período:</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.length > 0 ? (
                          availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={new Date().getFullYear().toString()}>
                            {new Date().getFullYear()}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Meses:</Label>
                    <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
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
                                : [...prev, month.num].sort((a, b) => a - b),
                            );
                          }}
                          className="h-9"
                        >
                          {month.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
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
                </div>

                {/* Separador visual */}
                <Separator />

                {/* Linha 3: Botão Buscar */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSearch}
                    disabled={loading || selectedMonths.length === 0}
                    className="w-full sm:w-auto min-w-[140px]"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Classification Panel */}
            {selectedTransactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Classificação em Lote ({selectedTransactions.length} selecionadas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Tipo de Natureza</Label>
                        <Select
                          value={bulkType}
                          onValueChange={(value) => {
                            setBulkType(value);
                            setBulkGroup("");
                            setBulkCommitment("");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de natureza" />
                          </SelectTrigger>
                          <SelectContent>
                            {types.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Grupo de Natureza</Label>
                        <Select
                          value={bulkGroup}
                          onValueChange={(value) => {
                            setBulkGroup(value);
                            setBulkCommitment("");
                          }}
                          disabled={!bulkType}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={!bulkType ? "Selecione primeiro o tipo" : "Selecione o grupo de natureza"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {bulkFilteredGroups.length === 0 && bulkType ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Nenhum grupo disponível para este tipo
                              </div>
                            ) : (
                              bulkFilteredGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full border-2"
                                      style={{
                                        borderColor: group.color,
                                        backgroundColor: `${group.color}20`,
                                      }}
                                    />
                                    {group.name}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Natureza</Label>
                        <Select value={bulkCommitment} onValueChange={setBulkCommitment} disabled={!bulkGroup}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !bulkType
                                  ? "Selecione primeiro o tipo"
                                  : !bulkGroup
                                    ? "Selecione primeiro o grupo"
                                    : "Selecione a natureza"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {bulkFilteredCommitments.length === 0 && bulkGroup ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Nenhuma natureza disponível para este grupo e tipo
                              </div>
                            ) : (
                              bulkFilteredCommitments.map((commitment) => (
                                <SelectItem key={commitment.id} value={commitment.id}>
                                  {commitment.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBulkClassify}
                        className="flex-1"
                        disabled={!bulkType || !bulkGroup || !bulkCommitment}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Classificar Selecionadas
                      </Button>
                      <Button variant="destructive" onClick={handleBulkRemoveClassification} className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Remover Classificação
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedTransactions([])}>
                        Limpar Seleção
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Movimentações</CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Itens por página:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Exibindo {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)}{" "}
                    de {totalItems} movimentações
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = filteredTransactions.map((t) => t.id);
                      if (selectedTransactions.length === allIds.length) {
                        setSelectedTransactions([]);
                      } else {
                        setSelectedTransactions(allIds);
                      }
                    }}
                  >
                    {selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0
                      ? "Desmarcar Todos"
                      : "Selecionar Todos"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Carregando movimentações...</p>
                    </div>
                  ) : !loading && transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhuma transação carregada</p>
                      <p className="text-sm">Selecione os filtros acima e clique em "Buscar"</p>
                    </div>
                  ) : (
                    <>
                      {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedTransactions.includes(transaction.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTransactions((prev) => [...prev, transaction.id]);
                                  } else {
                                    setSelectedTransactions((prev) => prev.filter((id) => id !== transaction.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <div>
                                <div className="font-medium">{transaction.description}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(parseISO(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                                  {transaction.bank?.bank_name && ` • ${transaction.bank.bank_name}`}
                                  {/*{transaction.memo && ` • ${transaction.memo}`}*/}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-semibold ${transaction.transaction_type === "credit" ? "text-green-600" : "text-red-600"}`}
                              >
                                R$ {Math.abs(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {transaction.transaction_type === "credit" ? "Crédito" : "Débito"}
                              </div>
                            </div>
                          </div>

                          {/* Classification Section */}
                          <div className="border-t pt-3">
                            {transaction.classification ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-green-500" />
                                  <div className="flex items-center gap-1">
                                    {transaction.classification.group_name && (
                                      <Badge
                                        variant="secondary"
                                        style={{
                                          backgroundColor: `${transaction.classification.group_color}20`,
                                          borderColor: transaction.classification.group_color,
                                        }}
                                      >
                                        {transaction.classification.group_name}
                                      </Badge>
                                    )}
                                    {transaction.classification.commitment_name && (
                                      <Badge variant="outline">{transaction.classification.commitment_name}</Badge>
                                    )}
                                    {transaction.classification.type_name && (
                                      <Badge variant="outline">{transaction.classification.type_name}</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Reset classification
                                    handleClassifyTransaction(transaction.id, "", "");
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-muted-foreground">
                                  Não classificado - Use a classificação em lote para classificar
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Pagination */}
                      {totalItems > itemsPerPage && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-muted-foreground">
                            Exibindo {(currentPage - 1) * itemsPerPage + 1} -{" "}
                            {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} movimentações
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                            >
                              Anterior
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, Math.ceil(totalItems / itemsPerPage)) }, (_, i) => {
                                const totalPages = Math.ceil(totalItems / itemsPerPage);
                                const page =
                                  currentPage <= 3
                                    ? i + 1
                                    : currentPage >= totalPages - 2
                                      ? totalPages - 4 + i
                                      : currentPage - 2 + i;

                                if (page < 1 || page > totalPages) return null;

                                return (
                                  <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                  >
                                    {page}
                                  </Button>
                                );
                              })}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage(Math.min(Math.ceil(totalItems / itemsPerPage), currentPage + 1))
                              }
                              disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                            >
                              Próxima
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hierarchy" className="space-y-6">
            {/* Filtro por Tipo de Natureza */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Filtrar por Tipo de Natureza</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todos os tipos de natureza" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos de natureza</SelectItem>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSearchHierarchy} className="whitespace-nowrap" disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Visualização da Hierarquia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TreePine className="w-5 h-5" />
                  Hierarquia de Naturezas
                </CardTitle>
                <CardDescription>Estrutura: Tipo de Natureza › Grupo de Natureza › Natureza</CardDescription>
              </CardHeader>
              <CardContent>
                {!hasSearchedHierarchy ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma hierarquia carregada</p>
                    <p className="text-sm">Selecione um filtro acima e clique em "Buscar"</p>
                  </div>
                ) : types.length === 0 ? (
                  <div className="text-center py-8">
                    <TreePine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma hierarquia encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      Tente selecionar "Todos os tipos de natureza" ou crie novos tipos na gestão da hierarquia
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredHierarchy().map((type) => (
                      <div key={type.id} className="border rounded-lg bg-card">
                        {/* Tipo de Empenho */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleType(type.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">{type.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {type.groups.length} grupos •{" "}
                                {type.groups.reduce((acc, g) => acc + g.commitments.length, 0)} naturezas
                              </p>
                            </div>
                          </div>
                          <div
                            className={`transition-transform duration-200 ${expandedTypes.has(type.id) ? "rotate-180" : ""}`}
                          >
                            ▼
                          </div>
                        </div>

                        {/* Grupos dentro do Tipo */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            expandedTypes.has(type.id) ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="px-4 pb-4 space-y-3">
                            {type.groups.map((group) => (
                              <div key={group.id} className="ml-6 border border-border/50 rounded-md bg-muted/20">
                                {/* Grupo de Natureza */}
                                <div
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => toggleGroup(group.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-4 h-4 rounded-full border-2"
                                      style={{ borderColor: group.color, backgroundColor: `${group.color}20` }}
                                    />
                                    <div>
                                      <h4 className="font-medium text-foreground">{group.name}</h4>
                                      {group.description && (
                                        <p className="text-xs text-muted-foreground">{group.description}</p>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        {group.commitments.length} naturezas
                                      </p>
                                    </div>
                                  </div>
                                  <div
                                    className={`transition-transform duration-200 ${expandedGroups.has(group.id) ? "rotate-180" : ""}`}
                                  >
                                    ▼
                                  </div>
                                </div>

                                {/* Naturezas dentro do Grupo */}
                                <div
                                  className={`overflow-hidden transition-all duration-300 ${
                                    expandedGroups.has(group.id) ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                  }`}
                                >
                                  <div className="px-3 pb-3 space-y-2">
                                    {group.commitments.length === 0 ? (
                                      <div className="ml-6 text-xs text-muted-foreground py-2">
                                        Nenhuma natureza criada neste grupo
                                      </div>
                                    ) : (
                                      group.commitments.map((commitment) => (
                                        <div
                                          key={commitment.id}
                                          className="ml-6 flex items-center gap-2 py-2 px-3 rounded-md bg-background border border-border/30"
                                        >
                                          <div className="w-2 h-2 rounded-full bg-primary/60" />
                                          <span className="text-sm text-foreground font-medium">{commitment.name}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gerenciar Hierarquia 
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Gerenciar Hierarquia de Naturezas
                </CardTitle>
                <CardDescription>
                  Crie e edite tipos, grupos e naturezas da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommitmentHierarchy
                  onSelectionChange={() => { }}
                  showManagement={true}
                  onHierarchyChange={fetchHierarchy}
                />
              </CardContent>
            </Card>*/}
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            {/* Filtro para Regras */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Carregar Regras</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleSearchRules} className="w-full" disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Regras
                </Button>
              </CardContent>
            </Card>

            {/* Regras de Classificação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Regras de Classificação Automática
                </CardTitle>
                <CardDescription>Gerencie as regras para classificação automática de movimentações</CardDescription>
              </CardHeader>
              <CardContent>
                {!hasSearchedRules ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma regra carregada</p>
                    <p className="text-sm">Clique em "Buscar Regras" acima para carregar</p>
                  </div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma regra encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie regras para automatizar a classificação das movimentações
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-foreground">{rule.rule_name}</h4>
                            <Badge variant="outline" className="text-xs">
                              Contém: "{rule.description_contains}"
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Classifica para:</span>
                            <div className="flex items-center gap-1">
                              {rule.commitment_group_id && (
                                <Badge variant="secondary" className="text-xs">
                                  Grupo
                                </Badge>
                              )}
                              {rule.commitment_id && (
                                <Badge variant="secondary" className="text-xs">
                                  Natureza
                                </Badge>
                              )}
                              {rule.commitment_type_id && (
                                <Badge variant="secondary" className="text-xs">
                                  Tipo
                                </Badge>
                              )}
                              {rule.bank_id ? (
                                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                  Banco: {banks.find(b => b.id === rule.bank_id)?.bank_name || 'Desconhecido'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-600">
                                  Todos os bancos
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Rule Dialog */}
        <Dialog open={isEditRuleDialogOpen} onOpenChange={setIsEditRuleDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Regra de Classificação</DialogTitle>
              <DialogDescription>Modifique a regra de classificação automática</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-rule-name">Nome da Regra</Label>
                <Input
                  id="edit-rule-name"
                  value={newRule.rule_name}
                  onChange={(e) => setNewRule((prev) => ({ ...prev, rule_name: e.target.value }))}
                  placeholder="Ex: Pagamentos com cartão VISA"
                />
              </div>
              <div>
                <Label htmlFor="edit-description-contains">Descrição contém</Label>
                <Input
                  id="edit-description-contains"
                  value={newRule.description_contains}
                  onChange={(e) => setNewRule((prev) => ({ ...prev, description_contains: e.target.value }))}
                  placeholder="Ex: VISA"
                />
              </div>

              <div>
                <Label htmlFor="edit-bank-select">Banco (opcional)</Label>
                <Select
                  value={newRule.bank_id || "all"}
                  onValueChange={(value) => 
                    setNewRule((prev) => ({ ...prev, bank_id: value === "all" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os bancos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os bancos</SelectItem>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.bank_name} ({bank.bank_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Se selecionado, a regra só será aplicada às transações deste banco
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Classificação</Label>
                <div className="space-y-4">
                  {/* Select Tipo de Natureza */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Tipo de Natureza</Label>
                    <Select
                      value={newRule.commitment_type_id}
                      onValueChange={(value) => {
                        setNewRule((prev) => ({
                          ...prev,
                          commitment_type_id: value,
                          commitment_group_id: "",
                          commitment_id: "",
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de natureza" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grupo filtered by Type */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Grupo de Natureza</Label>
                    <Select
                      value={newRule.commitment_group_id}
                      onValueChange={(value) =>
                        setNewRule((prev) => ({
                          ...prev,
                          commitment_group_id: value,
                          commitment_id: "",
                        }))
                      }
                      disabled={!newRule.commitment_type_id}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !newRule.commitment_type_id ? "Selecione primeiro o tipo" : "Selecione o grupo de natureza"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredGroups.length === 0 && newRule.commitment_type_id ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhum grupo disponível para este tipo
                          </div>
                        ) : (
                          filteredGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full border-2"
                                  style={{ borderColor: group.color, backgroundColor: `${group.color}20` }}
                                />
                                {group.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Natureza filtered by Type AND Group */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Natureza</Label>
                    <Select
                      value={newRule.commitment_id}
                      onValueChange={(value) => {
                        setNewRule((prev) => ({
                          ...prev,
                          commitment_id: value,
                        }));
                      }}
                      disabled={!newRule.commitment_group_id}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !newRule.commitment_type_id
                              ? "Selecione primeiro o tipo"
                              : !newRule.commitment_group_id
                                ? "Selecione primeiro o grupo"
                                : "Selecione a natureza"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCommitments.length === 0 && newRule.commitment_group_id ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhuma natureza disponível para este grupo e tipo
                          </div>
                        ) : (
                          filteredCommitments.map((commitment) => (
                            <SelectItem key={commitment.id} value={commitment.id}>
                              {commitment.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleUpdateRule} className="flex-1">
                  Atualizar Regra
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditRuleDialogOpen(false);
                    setEditingRule(null);
                    setNewRule({
                      rule_name: "",
                      description_contains: "",
                      commitment_group_id: "",
                      commitment_id: "",
                      commitment_type_id: "",
                      bank_id: "",
                    });
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TransactionClassification;
