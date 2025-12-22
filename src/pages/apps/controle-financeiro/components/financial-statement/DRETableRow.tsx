import { Fragment } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DRELine } from "@/pages/apps/controle-financeiro/utils/dreCalculations";
import { dreCalculations } from "@/pages/apps/controle-financeiro/utils/dreCalculations";
import { ViewType } from "@/pages/apps/controle-financeiro/constants/financialConstants";

interface DRETableRowProps {
  line: DRELine;
  isExpanded: boolean;
  onToggle: () => void;
  onCellClick: (periodIndex: number, columnLabel: string, year: number) => void;
  columnLabels: string[];
  viewType: ViewType;
  selectedYears: number[];
}

export function DRETableRow({
  line,
  isExpanded,
  onToggle,
  onCellClick,
  columnLabels,
  viewType,
  selectedYears,
}: DRETableRowProps) {
  const isMultiYear = selectedYears.length > 1;

  return (
    <TableRow
      className={`${dreCalculations.getRowClassName(line.type, line.level)} ${line.expandable ? "cursor-pointer" : ""} animate-fade-in`}
      onClick={() => line.expandable && onToggle()}
    >
      <TableCell className="font-medium border-r">
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
          </div>
        </div>
      </TableCell>

      {isMultiYear && line.yearValues ? (
        <>
          {line.yearValues.map((yearData) => (
            <Fragment key={yearData.year}>
              {yearData.values.map((value, periodIndex) => (
                <TableCell
                  key={`${yearData.year}-${periodIndex}`}
                  className="text-center"
                  onClick={(e) => {
                    if (line.type === "commitment" && value !== 0 && viewType === "month") {
                      e.stopPropagation();
                      const periodLabel = columnLabels[periodIndex];
                      onCellClick(periodIndex, periodLabel, yearData.year);
                    }
                  }}
                  style={{
                    cursor:
                      line.type === "commitment" && value !== 0 && viewType === "month"
                        ? "pointer"
                        : "default",
                  }}
                >
                  <span
                    className={`${
                      value > 0
                        ? "text-success dark:text-success"
                        : value < 0
                          ? "text-destructive dark:text-destructive"
                          : "text-card-foreground/60"
                    } ${line.type === "commitment" && value !== 0 && viewType === "month" ? "hover:underline" : ""}`}
                  >
                    {dreCalculations.formatCurrency(value)}
                  </span>
                </TableCell>
              ))}
              <TableCell key={`${yearData.year}-total`} className="text-center font-semibold border-r">
                <span
                  className={
                    yearData.total > 0
                      ? "text-success dark:text-success"
                      : yearData.total < 0
                        ? "text-destructive dark:text-destructive"
                        : "text-card-foreground/60"
                  }
                >
                  {dreCalculations.formatCurrency(yearData.total)}
                </span>
              </TableCell>
            </Fragment>
          ))}
        </>
      ) : (
        <>
          {line.values.map((value, periodIndex) => (
            <TableCell
              key={periodIndex}
              className="text-center"
              onClick={(e) => {
                if (line.type === "commitment" && value !== 0 && viewType === "month") {
                  e.stopPropagation();
                  const periodLabel = columnLabels[periodIndex];
                  onCellClick(periodIndex, periodLabel, selectedYears[0]);
                }
              }}
              style={{
                cursor:
                  line.type === "commitment" && value !== 0 && viewType === "month"
                    ? "pointer"
                    : "default",
              }}
            >
              <span
                className={`${
                  value > 0
                    ? "text-success dark:text-success"
                    : value < 0
                      ? "text-destructive dark:text-destructive"
                      : "text-card-foreground/60"
                } ${line.type === "commitment" && value !== 0 && viewType === "month" ? "hover:underline" : ""}`}
              >
                {dreCalculations.formatCurrency(value)}
              </span>
            </TableCell>
          ))}
        </>
      )}

      <TableCell className="text-center font-semibold">
        <span
          className={
            (line.grandTotal ?? line.values.reduce((sum, value) => sum + value, 0)) > 0
              ? "text-success dark:text-success"
              : (line.grandTotal ?? line.values.reduce((sum, value) => sum + value, 0)) < 0
                ? "text-destructive dark:text-destructive"
                : "text-card-foreground/60"
          }
        >
          {dreCalculations.formatCurrency(
            line.grandTotal ?? line.values.reduce((sum, value) => sum + value, 0)
          )}
        </span>
      </TableCell>
    </TableRow>
  );
}
