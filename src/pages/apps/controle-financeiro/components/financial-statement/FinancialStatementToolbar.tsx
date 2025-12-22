import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { RefreshCw } from "lucide-react";
import { VIEW_TYPE_OPTIONS, ViewType, ClassificationFilter, CLASSIFICATION_FILTER_OPTIONS } from "@/pages/apps/controle-financeiro/constants/financialConstants";

interface FinancialStatementToolbarProps {
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  availableYears: number[];
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  classificationFilter: ClassificationFilter;
  onClassificationFilterChange: (filter: ClassificationFilter) => void;
  onLoadData: () => void;
  onIntegrateData: () => void;
  isLoading: boolean;
  hasLoadedData: boolean;
}

export function FinancialStatementToolbar({
  selectedYears,
  onYearsChange,
  availableYears,
  viewType,
  onViewTypeChange,
  classificationFilter,
  onClassificationFilterChange,
  onLoadData,
  onIntegrateData,
  isLoading,
  hasLoadedData,
}: FinancialStatementToolbarProps) {
  const yearOptions = availableYears.map((year) => ({
    label: year.toString(),
    value: year.toString(),
  }));

  const handleYearSelectionChange = (selectedValues: string[]) => {
    const years = selectedValues.map((v) => parseInt(v)).sort((a, b) => a - b);
    onYearsChange(years);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-muted-foreground">Ano(s)</label>
          <MultiSelect
            options={yearOptions}
            selected={selectedYears.map((y) => y.toString())}
            onChange={handleYearSelectionChange}
            placeholder="Selecione ano(s)"
            emptyText="Nenhum ano disponível"
            className="w-64"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs text-muted-foreground">Visualizar por</label>
          <Select value={viewType} onValueChange={(value: ViewType) => onViewTypeChange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIEW_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs text-muted-foreground">Classificação</label>
          <Select value={classificationFilter} onValueChange={(value: ClassificationFilter) => onClassificationFilterChange(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASSIFICATION_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button onClick={onLoadData} disabled={isLoading} size="default" className="mt-5">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              "Carregar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
