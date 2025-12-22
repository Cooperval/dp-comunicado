import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Plus,
  CreditCard,
  Receipt,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { CashFlowTable } from "@/pages/apps/controle-financeiro/components/cash-flow/CashFlowTable";
import { CashFlowDetailModal } from "@/pages/apps/controle-financeiro/components/cash-flow/CashFlowDetailModal";
import { formatCurrency } from "@/pages/apps/controle-financeiro/utils/formatters";
import { futureEntrySchema, type FutureEntryForm } from "@/pages/apps/controle-financeiro/schemas/cashFlowSchema";
import { MONTH_BUTTONS } from "@/pages/apps/controle-financeiro/constants/cashFlowConstants";
import type {
  MonthlyCashFlow,
  FutureEntry,
  CommitmentGroup,
  Commitment,
  CommitmentType,
  CashFlowItem,
  DailyCashFlow,
  BankCashFlow,
  CashFlowType,
  DataKeyType,
} from "@/pages/apps/controle-financeiro/types/cashFlow";
import { CompanyBranchFilter } from "@/pages/apps/controle-financeiro/components/filters/CompanyBranchFilter";
import { useCompanyBranchFilter } from "@/pages/apps/controle-financeiro/hooks/useCompanyBranchFilter";

export default function CashFlow() {
  const { companyId } = useAuth();
  
  // Company and Branch filter
  const companyBranchFilter = useCompanyBranchFilter();
  
  // Estados aplicados (usados para carregar dados)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // Estados pending (usados na UI dos filtros)
  const [pendingYear, setPendingYear] = useState(new Date().getFullYear());
  const [pendingMonths, setPendingMonths] = useState<number[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedBanks, setExpandedBanks] = useState<Record<string, boolean>>({});
  const [showEmptyAccounts, setShowEmptyAccounts] = useState(false);

  // Estado do modal de detalhes
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState<{
    title: string;
    date: string;
    items: CashFlowItem[];
    type: CashFlowType;
  } | null>(null);

  const [monthlyData, setMonthlyData] = useState<MonthlyCashFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [futureEntries, setFutureEntries] = useState<FutureEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<FutureEntry | null>(null);
  const [commitmentGroups, setCommitmentGroups] = useState<CommitmentGroup[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [commitmentTypes, setCommitmentTypes] = useState<CommitmentType[]>([]);
  const [filterDescription, setFilterDescription] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const { toast } = useToast();

  const form = useForm<FutureEntryForm>({
    resolver: zodResolver(futureEntrySchema),
    defaultValues: {
      description: "",
      amount: "",
      due_date: "",
      entry_type: "payable",
      commitment_group_id: "",
      commitment_id: "",
      commitment_type_id: "",
      notes: "",
    },
  });

  const loadCashFlowData = async () => {
    setLoading(true);
    try {
      if (!companyId) return;

      // First load all banks
      const { data: banksData } = await supabase
        .from("banks")
        .select("id, bank_name, account_number")
        .eq("company_id", companyId)
        .order("bank_name");

      // Get available months from both transactions and future entries
      const [transactionDatesResult, futureEntriesResult] = await Promise.all([
        supabase
          .from("transactions")
          .select("transaction_date")
          .eq("company_id", companyId)
          .order("transaction_date", { ascending: true }),
        supabase
          .from("future_entries")
          .select("due_date")
          .eq("company_id", companyId)
          .order("due_date", { ascending: true }),
      ]);

      // Combine dates from both sources
      const allDates = [
        ...(transactionDatesResult.data || []).map((t) => t.transaction_date),
        ...(futureEntriesResult.data || []).map((fe) => fe.due_date),
      ];

      if (allDates.length === 0) {
        setMonthlyData([]);
        setAvailableMonths([]);
        setLoading(false);
        return;
      }

      // Get unique year-months from all available data
      const availableMonthsList = Array.from(new Set(allDates.map((date) => format(parseISO(date), "yyyy-MM")))).sort();

      setAvailableMonths(availableMonthsList);
      const allMonthsList = availableMonthsList;

      const months: MonthlyCashFlow[] = [];

      for (const monthKey of allMonthsList) {
        const monthDate = parseISO(monthKey + "-01");
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const daysInMonth = monthEnd.getDate();

        const bankCashFlows: BankCashFlow[] = [];

        // Future entries (load for all months)
        const { data: futureEntries } = await supabase
          .from("future_entries")
          .select(
            "id, amount, due_date, description, entry_type, status, commitment_group_id, commitment_id, commitment_type_id",
          )
          .eq("company_id", companyId)
          .gte("due_date", format(monthStart, "yyyy-MM-dd"))
          .lte("due_date", format(monthEnd, "yyyy-MM-dd"))
          .order("due_date", { ascending: true });

        // Get commitment data for future entries
        const commitmentGroupIds = [
          ...new Set(futureEntries?.map((fe) => fe.commitment_group_id).filter(Boolean) || []),
        ];
        const commitmentIds = [...new Set(futureEntries?.map((fe) => fe.commitment_id).filter(Boolean) || [])];
        const commitmentTypeIds = [...new Set(futureEntries?.map((fe) => fe.commitment_type_id).filter(Boolean) || [])];

        const [commitmentGroupsData, commitmentsData, commitmentTypesData] = await Promise.all([
          commitmentGroupIds.length > 0
            ? supabase
                .from("commitment_groups")
                .select("id, name")
                .eq("company_id", companyId)
                .in("id", commitmentGroupIds)
            : Promise.resolve({ data: [] }),
          commitmentIds.length > 0
            ? supabase.from("commitments").select("id, name").eq("company_id", companyId).in("id", commitmentIds)
            : Promise.resolve({ data: [] }),
          commitmentTypeIds.length > 0
            ? supabase
                .from("commitment_types")
                .select("id, name")
                .eq("company_id", companyId)
                .in("id", commitmentTypeIds)
            : Promise.resolve({ data: [] }),
        ]);

        // Create lookup maps
        const groupsMap = new Map((commitmentGroupsData.data || []).map((g) => [g.id, g.name]));
        const commitmentsMap = new Map((commitmentsData.data || []).map((c) => [c.id, c.name]));
        const typesMap = new Map((commitmentTypesData.data || []).map((t) => [t.id, t.name]));

        // Process banks if they exist, and add a "manual" bank only if there are future entries
        const banksToProcess = [
          ...(banksData || []),
          ...(futureEntries && futureEntries.length > 0
            ? [{ id: "manual", bank_name: "Lançamentos Manuais", account_number: "" }]
            : []),
        ];

        for (const bank of banksToProcess) {
          // Historical transactions for this bank (only if it's a real bank, not manual)
          let transactions = [];
          if (bank.id !== "manual") {
            const { data: transactionData } = await supabase
              .from("transactions")
              .select(
                `
                id, amount, transaction_date, description, transaction_type, bank_id,
                transaction_classifications(
                  commitment_groups(name),
                  commitments(name),
                  commitment_types(name)
                )
              `,
              )
              .eq("bank_id", bank.id)
              .eq("company_id", companyId)
              .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
              .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"))
              .order("transaction_date", { ascending: true });
            transactions = transactionData || [];
          }

          // Create daily breakdown for this bank
          const days: DailyCashFlow[] = [];
          let runningBalance = 0;

          for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
            const dayString = format(dayDate, "yyyy-MM-dd");

            const dayItems: CashFlowItem[] = [];
            let dayHistoricalIn = 0;
            let dayHistoricalOut = 0;
            let dayProjectedIn = 0;
            let dayProjectedOut = 0;

            // Process historical transactions for this day and bank
            (transactions || []).forEach((t) => {
              if (t.transaction_date === dayString) {
                const amount = Number(t.amount);
                const classification = t.transaction_classifications?.[0];

                dayItems.push({
                  date: t.transaction_date,
                  description: t.description,
                  amount: t.transaction_type === "credit" ? amount : -amount,
                  type: "historical",
                  bank_id: t.bank_id,
                  classification: {
                    group: classification?.commitment_groups?.name,
                    commitment: classification?.commitments?.name,
                    commitmentType: classification?.commitment_types?.name,
                  },
                });

                if (t.transaction_type === "credit") {
                  dayHistoricalIn += amount;
                } else {
                  dayHistoricalOut += amount;
                }
              }
            });

            // Process future entries for this day (only for manual bank)
            if (bank.id === "manual") {
              (futureEntries || []).forEach((fe) => {
                if (fe.due_date === dayString) {
                  const amount = Number(fe.amount);

                  dayItems.push({
                    date: fe.due_date,
                    description: fe.description,
                    amount: amount,
                    type: fe.entry_type as "payable" | "receivable",
                    status: fe.status,
                    classification: {
                      group: fe.commitment_group_id ? groupsMap.get(fe.commitment_group_id) : undefined,
                      commitment: fe.commitment_id ? commitmentsMap.get(fe.commitment_id) : undefined,
                      commitmentType: fe.commitment_type_id ? typesMap.get(fe.commitment_type_id) : undefined,
                    },
                  });

                  if (fe.entry_type === "receivable") {
                    dayProjectedIn += amount;
                  } else {
                    dayProjectedOut += amount;
                  }
                }
              });
            }

            const dayClosing = runningBalance + dayHistoricalIn - dayHistoricalOut + dayProjectedIn - dayProjectedOut;

            days.push({
              day: day,
              date: dayString,
              opening: runningBalance,
              historicalIn: dayHistoricalIn,
              historicalOut: dayHistoricalOut,
              projectedIn: dayProjectedIn,
              projectedOut: dayProjectedOut,
              closing: dayClosing,
              items: dayItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            });

            runningBalance = dayClosing;
          }

          // Calculate bank totals
          const totalHistoricalIn = days.reduce((sum, day) => sum + day.historicalIn, 0);
          const totalHistoricalOut = days.reduce((sum, day) => sum + day.historicalOut, 0);
          const totalProjectedIn = days.reduce((sum, day) => sum + day.projectedIn, 0);
          const totalProjectedOut = days.reduce((sum, day) => sum + day.projectedOut, 0);

          bankCashFlows.push({
            bank: {
              id: bank.id,
              bank_name: bank.bank_name,
              account_number: bank.account_number,
            },
            days: days,
            totalOpening: days[0]?.opening || 0,
            totalHistoricalIn,
            totalHistoricalOut,
            totalProjectedIn,
            totalProjectedOut,
            totalClosing: days[days.length - 1]?.closing || 0,
          });
        }

        // Calculate month totals across all banks
        const totalHistoricalIn = bankCashFlows.reduce((sum, bank) => sum + bank.totalHistoricalIn, 0);
        const totalHistoricalOut = bankCashFlows.reduce((sum, bank) => sum + bank.totalHistoricalOut, 0);
        const totalProjectedIn = bankCashFlows.reduce((sum, bank) => sum + bank.totalProjectedIn, 0);
        const totalProjectedOut = bankCashFlows.reduce((sum, bank) => sum + bank.totalProjectedOut, 0);

        months.push({
          month: monthKey,
          banks: bankCashFlows,
          totalOpening: bankCashFlows.reduce((sum, bank) => sum + bank.totalOpening, 0),
          totalHistoricalIn,
          totalHistoricalOut,
          totalProjectedIn,
          totalProjectedOut,
          totalClosing: bankCashFlows.reduce((sum, bank) => sum + bank.totalClosing, 0),
        });
      }

      setMonthlyData(months);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os dados do fluxo de caixa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar anos disponíveis
  const fetchAvailableYears = useCallback(async () => {
    if (!companyId) return;

    try {
      const [transactionDatesResult, futureEntriesResult] = await Promise.all([
        supabase
          .from("transactions")
          .select("transaction_date")
          .eq("company_id", companyId)
          .order("transaction_date", { ascending: false }),
        supabase
          .from("future_entries")
          .select("due_date")
          .eq("company_id", companyId)
          .order("due_date", { ascending: false }),
      ]);

      const allDates = [
        ...(transactionDatesResult.data || []).map((t) => t.transaction_date),
        ...(futureEntriesResult.data || []).map((fe) => fe.due_date),
      ];

      if (allDates.length === 0) {
        setAvailableYears([new Date().getFullYear()]);
        return;
      }

      const years = Array.from(new Set(allDates.map((date) => new Date(date).getFullYear()))).sort((a, b) => b - a);

      setAvailableYears(years);

      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os anos disponíveis",
        variant: "destructive",
      });
      setAvailableYears([new Date().getFullYear()]);
    }
  }, [companyId, selectedYear]);

  // Função separada para carregar apenas os meses disponíveis
  const loadAvailableMonths = useCallback(async () => {
    try {
      if (!companyId) return;

      const yearStart = `${pendingYear}-01-01`;
      const yearEnd = `${pendingYear}-12-31`;

      const [transactionDatesResult, futureEntriesResult] = await Promise.all([
        supabase
          .from("transactions")
          .select("transaction_date")
          .eq("company_id", companyId)
          .gte("transaction_date", yearStart)
          .lte("transaction_date", yearEnd)
          .order("transaction_date", { ascending: true }),
        supabase
          .from("future_entries")
          .select("due_date")
          .eq("company_id", companyId)
          .gte("due_date", yearStart)
          .lte("due_date", yearEnd)
          .order("due_date", { ascending: true }),
      ]);

      const allDates = [
        ...(transactionDatesResult.data || []).map((t) => t.transaction_date),
        ...(futureEntriesResult.data || []).map((fe) => fe.due_date),
      ];

      if (allDates.length === 0) {
        setAvailableMonths([]);
        return;
      }

      const availableMonthsList = Array.from(new Set(allDates.map((date) => format(parseISO(date), "yyyy-MM")))).sort();

      setAvailableMonths(availableMonthsList);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os meses disponíveis",
        variant: "destructive",
      });
    }
  }, [companyId, pendingYear]);

  const handleLoadData = async () => {
    // Validar que pelo menos um mês foi selecionado
    if (pendingMonths.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um mês para visualizar",
        variant: "destructive",
      });
      return;
    }

    // Aplicar os valores pending aos aplicados
    setSelectedYear(pendingYear);
    setSelectedMonths(pendingMonths);

    // Carregar os dados com os novos valores
    await loadCashFlowData();
  };

  useEffect(() => {
    if (companyId) {
      fetchAvailableYears();
    }
  }, [companyId, fetchAvailableYears]);

  // Carregar meses disponíveis quando pendingYear mudar
  useEffect(() => {
    if (companyId && pendingYear) {
      loadAvailableMonths();
    }
  }, [companyId, pendingYear, loadAvailableMonths]);

  // Sincronizar pendingYear com selectedYear na inicialização
  useEffect(() => {
    setPendingYear(selectedYear);
  }, []);

  useEffect(() => {
    const loadCommitmentData = async () => {
      try {
        if (!companyId) return;

        // Load commitment groups
        const { data: groups, error: groupsError } = await supabase
          .from("commitment_groups")
          .select("id, name")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("name");

        if (groupsError) throw groupsError;
        setCommitmentGroups(groups || []);

        // Load commitments with their commitment types
        const { data: commitmentData, error: commitmentsError } = await supabase
          .from("commitments")
          .select("id, name, commitment_group_id, commitment_type_id")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("name");

        if (commitmentsError) throw commitmentsError;
        setCommitments(commitmentData || []);

        // Load commitment types
        const { data: types, error: typesError } = await supabase
          .from("commitment_types")
          .select("id, name")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("name");

        if (typesError) throw typesError;
        setCommitmentTypes(types || []);
      } catch (error) {
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Não foi possível carregar os dados de classificação",
          variant: "destructive",
        });
      }
    };
    loadCommitmentData();
  }, [companyId, toast]);

  const selectedGroupId = form.watch("commitment_group_id");
  const selectedCommitmentId = form.watch("commitment_id");

  // Filter commitments based on selected group
  const filteredCommitments = commitments.filter((c) => !selectedGroupId || c.commitment_group_id === selectedGroupId);

  // Auto-set commitment type when commitment is selected
  useEffect(() => {
    if (selectedCommitmentId && selectedCommitmentId !== "none") {
      const selectedCommitment = commitments.find((c) => c.id === selectedCommitmentId);
      if (selectedCommitment?.commitment_type_id) {
        form.setValue("commitment_type_id", selectedCommitment.commitment_type_id);
      } else {
        form.setValue("commitment_type_id", "");
      }
    } else {
      form.setValue("commitment_type_id", "");
    }
  }, [selectedCommitmentId, commitments, form]);

  const getFilteredData = () => {
    const filteredMonths =
      selectedMonths.length > 0
        ? monthlyData.filter((month) => {
            const monthNumber = parseInt(month.month.split("-")[1]);
            return selectedMonths.includes(monthNumber);
          })
        : monthlyData;

    if (filteredMonths.length === 0) {
      return [];
    }

    const bankAggregates = new Map<string, BankCashFlow>();

    filteredMonths.forEach((month) => {
      month.banks.forEach((bankData) => {
        const bankId = bankData.bank.id;

        if (!bankAggregates.has(bankId)) {
          bankAggregates.set(bankId, {
            bank: bankData.bank,
            days: [],
            totalOpening: 0,
            totalHistoricalIn: 0,
            totalHistoricalOut: 0,
            totalProjectedIn: 0,
            totalProjectedOut: 0,
            totalClosing: 0,
          });
        }

        const aggregate = bankAggregates.get(bankId)!;

        aggregate.days.push(...bankData.days);
        aggregate.totalHistoricalIn += bankData.totalHistoricalIn;
        aggregate.totalHistoricalOut += bankData.totalHistoricalOut;
        aggregate.totalProjectedIn += bankData.totalProjectedIn;
        aggregate.totalProjectedOut += bankData.totalProjectedOut;
      });
    });

    bankAggregates.forEach((aggregate, bankId) => {
      if (aggregate.days.length === 0) return;

      aggregate.days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      aggregate.totalOpening = aggregate.days[0]?.opening || 0;
      aggregate.totalClosing =
        aggregate.totalOpening +
        aggregate.totalHistoricalIn -
        aggregate.totalHistoricalOut +
        aggregate.totalProjectedIn -
        aggregate.totalProjectedOut;
    });

    return Array.from(bankAggregates.values()).filter((bank) => {
      const hasMovement =
        bank.totalHistoricalIn > 0 ||
        bank.totalHistoricalOut > 0 ||
        bank.totalProjectedIn > 0 ||
        bank.totalProjectedOut > 0;

      return bank.days.length > 0 && (showEmptyAccounts || hasMovement);
    });
  };

  const filteredData = getFilteredData();

  const toggleBankExpansion = (bankId: string) => {
    setExpandedBanks((prev) => ({
      ...prev,
      [bankId]: !prev[bankId],
    }));
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const getCellItems = (
    day: DailyCashFlow,
    type: "historicalIn" | "historicalOut" | "projectedIn" | "projectedOut",
  ) => {
    const items = day.items.filter((item) => {
      switch (type) {
        case "historicalIn":
          return item.type === "historical" && item.amount > 0;
        case "historicalOut":
          return item.type === "historical" && item.amount < 0;
        case "projectedIn":
          return item.type === "receivable";
        case "projectedOut":
          return item.type === "payable";
        default:
          return false;
      }
    });
    return items;
  };

  const openCellDetails = useCallback((
    day: DailyCashFlow,
    type: DataKeyType,
    bankName: string,
  ) => {
    const items = getCellItems(day, type);

    const typeMap = {
      historicalIn: { label: "Entradas", type: "entry" as const },
      historicalOut: { label: "Saídas", type: "exit" as const },
      projectedIn: { label: "Receber", type: "receivable" as const },
      projectedOut: { label: "Pagar", type: "payable" as const },
    };

    const config = typeMap[type];

    setDetailModalData({
      title: bankName,
      date: day.date,
      items: items,
      type: config.type,
    });
    setDetailModalOpen(true);
  }, []);

  const loadFutureEntries = async () => {
    try {
      if (!companyId) return;

      const { data, error } = await supabase
        .from("future_entries")
        .select(
          `
          id, description, amount, due_date, entry_type, status, notes,
          commitment_group_id, commitment_id, commitment_type_id
        `,
        )
        .eq("company_id", companyId)
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Load related data separately
      const groupIds = [...new Set(data?.map((fe) => fe.commitment_group_id).filter(Boolean))];
      const commitmentIds = [...new Set(data?.map((fe) => fe.commitment_id).filter(Boolean))];
      const typeIds = [...new Set(data?.map((fe) => fe.commitment_type_id).filter(Boolean))];

      const [groupsData, commitmentsData, typesData] = await Promise.all([
        groupIds.length > 0
          ? supabase.from("commitment_groups").select("id, name").eq("company_id", companyId).in("id", groupIds)
          : Promise.resolve({ data: [] }),
        commitmentIds.length > 0
          ? supabase.from("commitments").select("id, name").eq("company_id", companyId).in("id", commitmentIds)
          : Promise.resolve({ data: [] }),
        typeIds.length > 0
          ? supabase.from("commitment_types").select("id, name").eq("company_id", companyId).in("id", typeIds)
          : Promise.resolve({ data: [] }),
      ]);

      // Create lookup maps
      const groupsMap = new Map((groupsData.data || []).map((g) => [g.id, g.name]));
      const commitmentsMap = new Map((commitmentsData.data || []).map((c) => [c.id, c.name]));
      const typesMap = new Map((typesData.data || []).map((t) => [t.id, t.name]));

      // Merge the data
      const enrichedEntries: FutureEntry[] = (data || []).map((entry) => ({
        ...entry,
        entry_type: entry.entry_type as "payable" | "receivable",
        commitment_groups: entry.commitment_group_id ? { name: groupsMap.get(entry.commitment_group_id) || "" } : null,
        commitments: entry.commitment_id ? { name: commitmentsMap.get(entry.commitment_id) || "" } : null,
        commitment_types: entry.commitment_type_id ? { name: typesMap.get(entry.commitment_type_id) || "" } : null,
      }));

      setFutureEntries(enrichedEntries);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os lançamentos futuros",
        variant: "destructive",
      });
    }
  };

  const combinedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    // Coletar todas as datas únicas
    const allDates = new Set<string>();
    filteredData.forEach((b) => b.days.forEach((d) => allDates.add(d.date)));
    const orderedDates = Array.from(allDates).sort(); // yyyy-MM-dd já ordena lexicograficamente

    // Indexar por banco+data pra pegar abertura do primeiro dia
    const dayByBankDate = new Map<string, DailyCashFlow>();
    filteredData.forEach((b) => {
      b.days.forEach((d) => {
        dayByBankDate.set(`${b.bank.id}__${d.date}`, d);
      });
    });

    // Abertura inicial: soma das aberturas do primeiro dia (se existir em cada banco)
    const firstDate = orderedDates[0];
    let runningBalance = filteredData.reduce((sum, b) => {
      const d = dayByBankDate.get(`${b.bank.id}__${firstDate}`);
      return sum + (d?.opening ?? 0);
    }, 0);

    const combinedDays: DailyCashFlow[] = [];

    orderedDates.forEach((date) => {
      // Agregar por data
      let historicalIn = 0;
      let historicalOut = 0;
      let projectedIn = 0;
      let projectedOut = 0;
      const items: CashFlowItem[] = [];

      filteredData.forEach((b) => {
        const d = dayByBankDate.get(`${b.bank.id}__${date}`);
        if (!d) return;
        historicalIn += d.historicalIn;
        historicalOut += d.historicalOut;
        projectedIn += d.projectedIn;
        projectedOut += d.projectedOut;
        if (d.items?.length) items.push(...d.items);
      });

      const opening = runningBalance;
      const closing = opening + historicalIn - historicalOut + projectedIn - projectedOut;

      combinedDays.push({
        day: Number(date.split("-")[2]),
        date,
        opening,
        historicalIn,
        historicalOut,
        projectedIn,
        projectedOut,
        closing,
        items: items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      });

      runningBalance = closing;
    });

    // Totais do consolidado
    const totalHistoricalIn = combinedDays.reduce((s, d) => s + d.historicalIn, 0);
    const totalHistoricalOut = combinedDays.reduce((s, d) => s + d.historicalOut, 0);
    const totalProjectedIn = combinedDays.reduce((s, d) => s + d.projectedIn, 0);
    const totalProjectedOut = combinedDays.reduce((s, d) => s + d.projectedOut, 0);

    // Abertura total do primeiro dia já calculada em runningBalance inicial (antes do loop)
    const totalOpening = combinedDays[0]?.opening ?? 0;
    const totalClosing = combinedDays[combinedDays.length - 1]?.closing ?? 0;

    const combinedBank: BankCashFlow = {
      bank: { id: "all", bank_name: "Consolidado (todos os bancos)", account_number: "" },
      days: combinedDays,
      totalOpening,
      totalHistoricalIn,
      totalHistoricalOut,
      totalProjectedIn,
      totalProjectedOut,
      totalClosing,
    };

    return combinedBank;
  }, [filteredData]);

  const handleEditEntry = useCallback((entry: FutureEntry) => {
    setEditingEntry(entry);
    form.reset({
      description: entry.description,
      amount: entry.amount.toString(),
      due_date: entry.due_date,
      entry_type: entry.entry_type,
      commitment_group_id: entry.commitment_group_id || "",
      commitment_id: entry.commitment_id || "",
      commitment_type_id: entry.commitment_type_id || "",
      notes: entry.notes || "",
    });
    setModalOpen(true);
  }, [form]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    try {
      if (!companyId) return;

      const { error } = await supabase.from("future_entries").delete().eq("id", entryId).eq("company_id", companyId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso",
      });

      loadFutureEntries();
      loadCashFlowData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o lançamento",
        variant: "destructive",
      });
    }
  }, [companyId, toast]);

  const onSubmit = async (data: FutureEntryForm) => {
    setModalLoading(true);
    try {
      const entryData = {
        description: data.description,
        amount: Number(data.amount),
        due_date: data.due_date,
        entry_type: data.entry_type,
        commitment_group_id:
          data.commitment_group_id && data.commitment_group_id !== "none" ? data.commitment_group_id : null,
        commitment_id: data.commitment_id && data.commitment_id !== "none" ? data.commitment_id : null,
        commitment_type_id:
          data.commitment_type_id && data.commitment_type_id !== "none" ? data.commitment_type_id : null,
        notes: data.notes || null,
        company_id: companyId,
      };

      let error;
      if (editingEntry) {
        const { error: updateError } = await supabase
          .from("future_entries")
          .update(entryData)
          .eq("id", editingEntry.id)
          .eq("company_id", companyId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from("future_entries").insert([entryData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: editingEntry ? "Lançamento atualizado com sucesso" : "Lançamento criado com sucesso",
      });

      setModalOpen(false);
      setEditingEntry(null);
      form.reset();
      loadCashFlowData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar o lançamento",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "historical":
        return <ArrowUpDown className="h-4 w-4" />;
      case "receivable":
        return <Receipt className="h-4 w-4 text-green-600" />;
      case "payable":
        return <CreditCard className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "historical":
        return "Realizado";
      case "receivable":
        return "Receber";
      case "payable":
        return "Pagar";
      default:
        return "Outros";
    }
  };


  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados disponíveis para exportar",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados da tabela principal por banco
    const mainTableData = [];

    filteredData.forEach((bankData, bankIndex) => {
      // Header do banco
      mainTableData.push([`BANCO: ${bankData.bank.bank_name} - ${bankData.bank.account_number}`]);

      // Header da tabela
      const headerRow = ["Tipo", ...bankData.days.map((day) => `${day.day}/${day.date.split("-")[1]}`), "Total"];
      mainTableData.push(headerRow);

      // Linhas de dados
      const entradasRow = [
        "Entradas",
        ...bankData.days.map((day) => day.historicalIn || 0),
        bankData.totalHistoricalIn,
      ];
      mainTableData.push(entradasRow);

      const saidasRow = ["Saídas", ...bankData.days.map((day) => day.historicalOut || 0), bankData.totalHistoricalOut];
      mainTableData.push(saidasRow);

      const receberRow = ["Receber", ...bankData.days.map((day) => day.projectedIn || 0), bankData.totalProjectedIn];
      mainTableData.push(receberRow);

      const pagarRow = ["Pagar", ...bankData.days.map((day) => day.projectedOut || 0), bankData.totalProjectedOut];
      mainTableData.push(pagarRow);

      const saldoRow = [
        "Saldo",
        ...bankData.days.map((day) => day.closing || 0),
        bankData.days[bankData.days.length - 1]?.closing || 0,
      ];
      mainTableData.push(saldoRow);

      // Linha em branco entre bancos
      if (bankIndex < filteredData.length - 1) {
        mainTableData.push([""]);
      }
    });

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Criar worksheet principal
    const wsMain = XLSX.utils.aoa_to_sheet(mainTableData);
    XLSX.utils.book_append_sheet(wb, wsMain, "Fluxo de Caixa");

    // Gerar nome do arquivo
    const monthLabels =
      selectedMonths.length > 0
        ? selectedMonths.map((m) => m.toString().padStart(2, "0")).join("-")
        : format(new Date(), "MM");

    const fileName = `fluxo-caixa-${selectedYear}-${monthLabels}.xlsx`;

    // Salvar arquivo
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Sucesso",
      description: "Arquivo Excel exportado com sucesso",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={exportToExcel} disabled={!filteredData || filteredData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>

          <Dialog
            open={modalOpen}
            onOpenChange={(open) => {
              setModalOpen(open);
              if (!open) {
                setEditingEntry(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Lançamento
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Editar Lançamento" : "Novo Lançamento Futuro"}</DialogTitle>
                <DialogDescription>
                  {editingEntry
                    ? "Edite os dados do lançamento"
                    : "Adicione um novo lançamento futuro (conta a pagar ou a receber)"}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite a descrição" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="due_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="entry_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="receivable">Receber</SelectItem>
                            <SelectItem value="payable">Pagar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commitment_group_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo de Natureza (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um grupo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {commitmentGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commitment_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Natureza (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma natureza" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {filteredCommitments.map((commitment) => (
                              <SelectItem key={commitment.id} value={commitment.id}>
                                {commitment.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commitment_type_id"
                    render={({ field }) => {
                      const selectedCommitment = commitments.find((c) => c.id === form.watch("commitment_id"));
                      const commitmentType = commitmentTypes.find(
                        (t) => t.id === selectedCommitment?.commitment_type_id,
                      );

                      return (
                        <FormItem>
                          <FormLabel>Tipo de Natureza (Automático)</FormLabel>
                          <FormControl>
                            <Input
                              value={commitmentType?.name || "Nenhum tipo definido"}
                              disabled
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Digite observações adicionais" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingEntry(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={modalLoading}>
                  {modalLoading ? "Salvando..." : editingEntry ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => {
              loadFutureEntries();
              setManageModalOpen(true);
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Verificar Lançamentos
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o ano e os meses para visualizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium min-w-[60px]">Período:</Label>
              <Select
                value={pendingYear.toString()}
                onValueChange={(value) => {
                  setPendingYear(Number(value));
                  setPendingMonths([]);
                }}
              >
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
                    <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Meses:</Label>
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
                {MONTH_BUTTONS.map((month) => (
                  <Button
                    key={month.num}
                    type="button"
                    variant={pendingMonths.includes(month.num) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setPendingMonths((prev) =>
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
                  onClick={() => setPendingMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                  className="flex-1"
                >
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingMonths([])}
                  className="flex-1"
                >
                  Limpar
                </Button>
              </div>

              {/* Botão Carregar */}
              <Button
                type="button"
                onClick={handleLoadData}
                disabled={loading || pendingMonths.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Carregar Dados
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="show-empty-accounts"
                checked={showEmptyAccounts}
                onCheckedChange={(checked) => setShowEmptyAccounts(checked as boolean)}
              />
              <Label htmlFor="show-empty-accounts" className="text-sm cursor-pointer">
                Mostrar contas sem movimentação
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de Caixa por Banco */}
      <div className="space-y-4">
        {selectedMonths.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Selecione pelo menos um mês</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Escolha o ano e os meses desejados, depois clique em "Carregar Dados"
              </p>
            </CardContent>
          </Card>
        ) : filteredData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {loading ? "Carregando dados..." : "Nenhum dado encontrado"}
              </h3>
              <p className="text-gray-500">
                {loading
                  ? "Aguarde enquanto carregamos os dados do fluxo de caixa."
                  : "Não há dados de fluxo de caixa para o período selecionado."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((bankData) => (
            <Card key={bankData.bank.id}>
              <Collapsible
                open={expandedBanks[bankData.bank.id]}
                onOpenChange={() => toggleBankExpansion(bankData.bank.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{bankData.bank.bank_name}</CardTitle>
                          <CardDescription>Conta: {bankData.bank.account_number}</CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Saldo Final</div>
                          <div className="text-lg font-bold text-primary">{formatCurrency(bankData.totalClosing)}</div>
                        </div>

                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-green-600">
                            +{formatCurrency(bankData.totalHistoricalIn + bankData.totalProjectedIn)}
                          </Badge>
                          <Badge variant="outline" className="text-red-600">
                            -{formatCurrency(bankData.totalHistoricalOut + bankData.totalProjectedOut)}
                          </Badge>
                        </div>

                        {expandedBanks[bankData.bank.id] ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent>
                    <CashFlowTable
                      bankData={bankData}
                      bankId={bankData.bank.id}
                      bankName={bankData.bank.bank_name}
                      onOpenDetails={(day, type) => openCellDetails(day, type, bankData.bank.bank_name)}
                      formatCurrency={formatCurrency}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}

        {/* Consolidado: todos os bancos juntos */}
        {selectedMonths.length > 0 && combinedData && combinedData.days.length > 0 && (
          <Card>
            <Collapsible
              open={expandedBanks[combinedData.bank.id]}
              onOpenChange={() => toggleBankExpansion(combinedData.bank.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{combinedData.bank.bank_name}</CardTitle>
                        <CardDescription>Visão unificada sem separação por banco</CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Saldo Final</div>
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(combinedData.totalClosing)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-green-600">
                          +{formatCurrency(combinedData.totalHistoricalIn + combinedData.totalProjectedIn)}
                        </Badge>
                        <Badge variant="outline" className="text-red-600">
                          -{formatCurrency(combinedData.totalHistoricalOut + combinedData.totalProjectedOut)}
                        </Badge>
                      </div>

                      {expandedBanks[combinedData.bank.id] ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent>
                  <CashFlowTable
                    bankData={combinedData}
                    bankId={combinedData.bank.id}
                    bankName="Todos os Bancos"
                    onOpenDetails={(day, type) => openCellDetails(day, type, "Todos os Bancos")}
                    formatCurrency={formatCurrency}
                  />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>

      {/* Manage Future Entries Modal */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Lançamentos Futuros</DialogTitle>
            <DialogDescription>Visualize e gerencie todos os lançamentos futuros</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filtros */}
            <div className="space-y-3">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="filter-description">Pesquisar</Label>
                  <Input
                    id="filter-description"
                    placeholder="Buscar por descrição..."
                    value={filterDescription}
                    onChange={(e) => setFilterDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="filter-type">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger id="filter-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="receivable">Receber</SelectItem>
                      <SelectItem value="payable">Pagar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="filter-status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="received">Recebido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-group">Grupo</Label>
                  <Select value={filterGroup} onValueChange={setFilterGroup}>
                    <SelectTrigger id="filter-group">
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {commitmentGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {futureEntries.filter((entry) => {
              const matchesDescription =
                filterDescription === "" || entry.description.toLowerCase().includes(filterDescription.toLowerCase());
              const matchesType = filterType === "all" || entry.entry_type === filterType;
              const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
              const matchesGroup = filterGroup === "all" || entry.commitment_group_id === filterGroup;
              return matchesDescription && matchesType && matchesStatus && matchesGroup;
            }).length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum lançamento futuro encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-200 p-2 text-left">Data</th>
                      <th className="border border-gray-200 p-2 text-left">Descrição</th>
                      <th className="border border-gray-200 p-2 text-left">Valor</th>
                      <th className="border border-gray-200 p-2 text-left">Tipo</th>
                      <th className="border border-gray-200 p-2 text-left">Status</th>
                      <th className="border border-gray-200 p-2 text-left">Grupo</th>
                      <th className="border border-gray-200 p-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {futureEntries
                      .filter((entry) => {
                        const matchesDescription =
                          filterDescription === "" ||
                          entry.description.toLowerCase().includes(filterDescription.toLowerCase());
                        const matchesType = filterType === "all" || entry.entry_type === filterType;
                        const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
                        const matchesGroup = filterGroup === "all" || entry.commitment_group_id === filterGroup;
                        return matchesDescription && matchesType && matchesStatus && matchesGroup;
                      })
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-2">
                            {format(parseISO(entry.due_date), "dd/MM/yyyy")}
                          </td>
                          <td className="border border-gray-200 p-2">{entry.description}</td>
                          <td className="border border-gray-200 p-2">
                            <span className={entry.entry_type === "receivable" ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(entry.amount)}
                            </span>
                          </td>
                          <td className="border border-gray-200 p-2">
                            <Badge variant={entry.entry_type === "receivable" ? "default" : "secondary"}>
                              {getTypeLabel(entry.entry_type)}
                            </Badge>
                          </td>
                          <td className="border border-gray-200 p-2">
                            <Badge variant="outline">{entry.status}</Badge>
                          </td>
                          <td className="border border-gray-200 p-2">{entry.commitment_groups?.name || "-"}</td>
                          <td className="border border-gray-200 p-2 text-center">
                            <div className="flex gap-2 justify-center">
                              <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
                                    handleDeleteEntry(entry.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Cash Flow */}
      {detailModalData && (
        <CashFlowDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          title={detailModalData.title}
          date={detailModalData.date}
          items={detailModalData.items}
          type={detailModalData.type}
        />
      )}
    </div>
  );
}
