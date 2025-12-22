import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { financialStatementService } from "@/pages/apps/controle-financeiro/services/financialStatementService";
import { dreCalculations, DRELine } from "@/pages/apps/controle-financeiro/utils/dreCalculations";
import { ViewType, ClassificationFilter } from "@/pages/apps/controle-financeiro/constants/financialConstants";

export function useFinancialStatement(
  companyId: string | undefined,
  selectedCompanyId?: string,
  selectedBranchId?: string
) {
  const [dreLines, setDreLines] = useState<DRELine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [viewType, setViewType] = useState<ViewType>("month");
  const [classificationFilter, setClassificationFilter] = useState<ClassificationFilter>("all");
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const fetchAvailableYears = useCallback(async () => {
    if (!companyId) return;

    const yearsArray = await financialStatementService.fetchAvailableYears(companyId);
    setAvailableYears(yearsArray);

    if (yearsArray.length > 0) {
      const validYears = selectedYears.filter((year) => yearsArray.includes(year));
      if (validYears.length === 0) {
        setSelectedYears([yearsArray[0]]);
      }
    }
  }, [companyId, selectedYears]);

  const fetchTransactionData = useCallback(async () => {
    if (!companyId || selectedYears.length === 0) return;

    setLoading(true);
    try {
      const allYearsData = await Promise.all(
        selectedYears.map((year) =>
          financialStatementService.fetchIntegratedTransactions({
            companyId: selectedCompanyId || companyId,
            branchId: selectedBranchId,
            year,
            viewType,
            classificationFilter,
          })
        )
      );

      const hasAnyData = allYearsData.some((data) => data && data.length > 0);

      if (!hasAnyData) {
        setDreLines([]);
        return;
      }

      const lines = dreCalculations.processMultiYearDataForDRE(
        allYearsData,
        selectedYears,
        viewType
      );
      setDreLines(lines);
    } catch (error) {
      // Error already logged in service
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedYears, viewType, classificationFilter]);

  const loadData = async () => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive",
      });
      return;
    }

    setHasLoadedData(true);
    await fetchTransactionData();
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

  const handleViewTypeChange = (newViewType: ViewType) => {
    setDreLines([]);
    setHasLoadedData(false);
    setExpandedLines(new Set());
    setViewType(newViewType);
  };

  const handleClassificationFilterChange = (newFilter: ClassificationFilter) => {
    setDreLines([]);
    setHasLoadedData(false);
    setClassificationFilter(newFilter);
  };

  useEffect(() => {
    if (companyId) {
      fetchAvailableYears();
    }

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
            fetchTransactionData();
          }
        }
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
            fetchTransactionData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
    };
  }, [selectedYears, hasLoadedData, companyId, fetchAvailableYears, fetchTransactionData]);

  const monthlyTotals = useMemo(() => {
    if (selectedYears.length === 1) {
      return dreCalculations.calculateMonthlyTotals(dreLines, viewType);
    }
    return dreCalculations.calculateMultiYearMonthlyTotals(dreLines, selectedYears, viewType);
  }, [dreLines, viewType, selectedYears]);

  const grandTotal = useMemo(() => {
    if (Array.isArray(monthlyTotals) && monthlyTotals.length > 0) {
      if (typeof monthlyTotals[0] === "object" && "totals" in monthlyTotals[0]) {
        // Multi-year: somar todos os totais de todos os anos
        return (monthlyTotals as { year: number; totals: number[] }[]).reduce(
          (sum, yearData) => sum + dreCalculations.calculateGrandTotal(yearData.totals),
          0
        );
      }
      // Single year
      return dreCalculations.calculateGrandTotal(monthlyTotals as number[]);
    }
    return 0;
  }, [monthlyTotals]);

  const columnLabels = useMemo(
    () => dreCalculations.getColumnLabels(viewType),
    [viewType]
  );

  return {
    dreLines,
    loading,
    hasLoadedData,
    selectedYears,
    setSelectedYears,
    viewType,
    setViewType: handleViewTypeChange,
    classificationFilter,
    setClassificationFilter: handleClassificationFilterChange,
    availableYears,
    expandedLines,
    toggleLineExpansion,
    loadData,
    monthlyTotals,
    grandTotal,
    columnLabels,
  };
}
