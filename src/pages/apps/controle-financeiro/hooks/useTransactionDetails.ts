import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { financialStatementService } from "@/pages/apps/controle-financeiro/services/financialStatementService";
import { DRELine } from "@/pages/apps/controle-financeiro/utils/dreCalculations";
import { DetailTransaction } from "@/pages/apps/controle-financeiro/types/financialStatement";

export function useTransactionDetails(
  companyId: string | undefined,
  selectedYear: number
) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [transactions, setTransactions] = useState<DetailTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const openDetails = useCallback(async (
    line: DRELine,
    allLines: DRELine[],
    periodIndex: number,
    columnLabel: string
  ) => {
    if (!companyId) return;

    setLoading(true);
    setTitle(`${line.label.trim()} - ${columnLabel}/${selectedYear}`);
    setIsOpen(true);

    try {
      const startDate = new Date(selectedYear, periodIndex, 1);
      const endDate = new Date(selectedYear, periodIndex + 1, 0);

      const parentGroupLine = allLines.find((l) => l.id === line.parentId);
      const parentTypeLine = parentGroupLine
        ? allLines.find((l) => l.id === parentGroupLine.parentId)
        : null;

      const processedTransactions = await financialStatementService.fetchDetailTransactions({
        companyId,
        commitmentTypeId: parentTypeLine?.itemId || null,
        commitmentGroupId: parentGroupLine?.itemId || null,
        commitmentId: line.itemId || null,
        startDate,
        endDate,
      });

      setTransactions(processedTransactions);
    } catch (error) {
      toast({
        title: "Erro ao buscar detalhes",
        description: "Não foi possível carregar as movimentações detalhadas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedYear]);

  const closeDetails = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    title,
    transactions,
    loading,
    openDetails,
    closeDetails,
  };
}
