import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { VIEW_TYPE_OPTIONS, ViewType } from "@/pages/apps/controle-financeiro/constants/financialConstants";

interface BudgetToolbarProps {
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  availableYears: number[];
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  onLoadData: () => void;
  isLoading: boolean;
}

export function BudgetToolbar({
  selectedYears,
  onYearsChange,
  availableYears,
  viewType,
  onViewTypeChange,
  onLoadData,
  isLoading,
}: BudgetToolbarProps) {
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
          <Select value={viewType} onValueChange={(value) => onViewTypeChange(value as ViewType)}>
            <SelectTrigger className="w-48">
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
