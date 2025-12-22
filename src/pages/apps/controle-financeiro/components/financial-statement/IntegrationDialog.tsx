import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { MONTH_NAMES } from "@/pages/apps/controle-financeiro/constants/financialConstants";
import { ALL_MONTHS } from "@/pages/apps/controle-financeiro/constants/dreConstants";

interface IntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
  selectedMonths: number[];
  onMonthsChange: (months: number[]) => void;
  onIntegrate: () => void;
  isIntegrating: boolean;
}

export function IntegrationDialog({
  open,
  onOpenChange,
  integrationYear,
  onYearChange,
  availableYears,
  selectedMonths,
  onMonthsChange,
  onIntegrate,
  isIntegrating,
}: IntegrationDialogProps) {
  const toggleMonth = (month: number) => {
    onMonthsChange(
      selectedMonths.includes(month)
        ? selectedMonths.filter((m) => m !== month)
        : [...selectedMonths, month].sort((a, b) => a - b)
    );
  };

  const selectAllMonths = () => {
    onMonthsChange([...ALL_MONTHS]);
  };

  const clearMonths = () => {
    onMonthsChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onYearChange(parseInt(value));
                onMonthsChange([]);
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Meses</label>
            <div className="grid grid-cols-4 gap-2">
              {MONTH_NAMES.map((label, index) => {
                const num = index + 1;
                return (
                  <Button
                    key={num}
                    type="button"
                    variant={selectedMonths.includes(num) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMonth(num)}
                    className="h-9"
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllMonths}
                className="flex-1"
              >
                Selecionar Todos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearMonths}
                className="flex-1"
              >
                Limpar
              </Button>
            </div>
          </div>

          {selectedMonths.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-md text-sm border">
              <p className="font-medium mb-1">Resumo da Integração:</p>
              <p className="text-muted-foreground text-xs">
                Ano: <strong>{integrationYear}</strong>
              </p>
              <p className="text-muted-foreground text-xs">
                Meses: {selectedMonths.map((m) => MONTH_NAMES[m - 1]).join(", ")}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isIntegrating}>
            Cancelar
          </Button>
          <Button onClick={onIntegrate} disabled={isIntegrating || selectedMonths.length === 0}>
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
  );
}
