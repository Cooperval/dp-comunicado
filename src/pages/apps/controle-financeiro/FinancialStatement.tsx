import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText } from "lucide-react";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { FinancialStatementToolbar } from "@/pages/apps/controle-financeiro/components/financial-statement/FinancialStatementToolbar";
import { IntegrationDialog } from "@/pages/apps/controle-financeiro/components/financial-statement/IntegrationDialog";
import { TransactionDetailModal } from "@/pages/apps/controle-financeiro/components/financial-statement/TransactionDetailModal";
import { DRETable } from "@/pages/apps/controle-financeiro/components/financial-statement/DRETable";
import { useFinancialStatement } from "@/pages/apps/controle-financeiro/hooks/useFinancialStatement";
import { useIntegration } from "@/pages/apps/controle-financeiro/hooks/useIntegration";
import { useTransactionDetails } from "@/pages/apps/controle-financeiro/hooks/useTransactionDetails";
import { useClassificationAlert } from "@/pages/apps/controle-financeiro/hooks/useClassificationAlert";
import { DRELine } from "@/pages/apps/controle-financeiro/utils/dreCalculations";
import { CompanyBranchFilter } from "@/pages/apps/controle-financeiro/components/filters/CompanyBranchFilter";
import { useCompanyBranchFilter } from "@/pages/apps/controle-financeiro/hooks/useCompanyBranchFilter";

const FinancialStatement: React.FC = () => {
  const { companyId } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Company and Branch filter
  const companyBranchFilter = useCompanyBranchFilter();

  // Custom hooks
  const {
    dreLines,
    loading,
    hasLoadedData,
    selectedYears,
    setSelectedYears,
    viewType,
    setViewType,
    classificationFilter,
    setClassificationFilter,
    availableYears,
    expandedLines,
    toggleLineExpansion,
    loadData,
    monthlyTotals,
    grandTotal,
    columnLabels,
  } = useFinancialStatement(companyId, companyBranchFilter.selectedCompanyId, companyBranchFilter.selectedBranchId);

  const integration = useIntegration(companyId);
  const details = useTransactionDetails(companyId, selectedYears[0] || new Date().getFullYear());
  const { unclassifiedCount, showAlert } = useClassificationAlert(companyId, hasLoadedData);

  const handleCellClick = (
    line: DRELine,
    periodIndex: number,
    columnLabel: string,
    year: number
  ) => {
    details.openDetails(line, dreLines, periodIndex, columnLabel);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasLoadedData && dreLines.length === 0) {
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

        <FinancialStatementToolbar
          selectedYears={selectedYears}
          onYearsChange={setSelectedYears}
          availableYears={availableYears.length > 0 ? availableYears : [currentYear]}
          viewType={viewType}
          onViewTypeChange={setViewType}
          classificationFilter={classificationFilter}
          onClassificationFilterChange={setClassificationFilter}
          onLoadData={loadData}
          onIntegrateData={integration.openDialog}
          isLoading={loading}
          hasLoadedData={hasLoadedData}
        />

        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Nenhum dado carregado
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Selecione um ano e clique em <strong>"Carregar"</strong> para visualizar o
              demonstrativo financeiro.
            </p>
          </CardContent>
        </Card>
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
      
      <FinancialStatementToolbar
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        availableYears={availableYears.length > 0 ? availableYears : [currentYear]}
        viewType={viewType}
        onViewTypeChange={setViewType}
        classificationFilter={classificationFilter}
        onClassificationFilterChange={setClassificationFilter}
        onLoadData={loadData}
        onIntegrateData={integration.openDialog}
        isLoading={loading}
        hasLoadedData={hasLoadedData}
      />

      <IntegrationDialog
        open={integration.isOpen}
        onOpenChange={(open) => (open ? integration.openDialog() : integration.closeDialog())}
        integrationYear={integration.integrationYear}
        onYearChange={integration.setIntegrationYear}
        availableYears={integration.availableYears}
        selectedMonths={integration.selectedMonths}
        onMonthsChange={integration.setSelectedMonths}
        onIntegrate={integration.integrate}
        isIntegrating={integration.isIntegrating}
      />

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
          {showAlert && hasLoadedData && (
            <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertTitle className="text-orange-800 dark:text-orange-300">
                Atenção: Transações não classificadas
              </AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                Existem <strong>{unclassifiedCount} transações sem classificação</strong>. Isso
                pode comprometer a precisão dos resultados mostrados nesta página, pois apenas
                transações classificadas são incluídas no demonstrativo.
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

          <DRETable
            lines={dreLines}
            columnLabels={columnLabels}
            monthlyTotals={monthlyTotals}
            grandTotal={grandTotal}
            expandedLines={expandedLines}
            onToggleExpansion={toggleLineExpansion}
            onCellClick={handleCellClick}
            viewType={viewType}
            selectedYears={selectedYears}
          />
        </CardContent>
      </Card>

      <TransactionDetailModal
        open={details.isOpen}
        onOpenChange={details.closeDetails}
        title={details.title}
        transactions={details.transactions}
        loading={details.loading}
      />
    </div>
  );
};

export default FinancialStatement;
