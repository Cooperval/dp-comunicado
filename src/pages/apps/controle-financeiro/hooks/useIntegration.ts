import { useState, useEffect } from "react";
import { financialStatementService } from "@/pages/apps/controle-financeiro/services/financialStatementService";
import { aggregationService } from "@/pages/apps/controle-financeiro/services/aggregationService";

export function useIntegration(companyId: string | undefined) {
  const [isOpen, setIsOpen] = useState(false);
  const [integrationYear, setIntegrationYear] = useState<number>(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isIntegrating, setIsIntegrating] = useState(false);

  const fetchAvailableYears = async () => {
    if (!companyId) return;

    const years = await financialStatementService.fetchIntegrationAvailableYears(companyId);
    setAvailableYears(years);

    if (years.length > 0 && !years.includes(integrationYear)) {
      setIntegrationYear(years[0]);
    }
  };

  useEffect(() => {
    if (isOpen && companyId) {
      fetchAvailableYears();
    }
  }, [isOpen, companyId]);

  const openDialog = () => {
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setSelectedMonths([]);
  };

  const integrate = async () => {
    if (!companyId) return;

    setIsIntegrating(true);
    try {
      await aggregationService.integrateData({
        companyId,
        year: integrationYear,
        selectedMonths,
      });
      closeDialog();
    } catch (error) {
      // Error handling is done in the service
    } finally {
      setIsIntegrating(false);
    }
  };

  return {
    isOpen,
    openDialog,
    closeDialog,
    integrationYear,
    setIntegrationYear,
    selectedMonths,
    setSelectedMonths,
    availableYears,
    isIntegrating,
    integrate,
  };
}
