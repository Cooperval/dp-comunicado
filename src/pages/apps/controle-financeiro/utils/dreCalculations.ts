import { MONTH_NAMES, QUARTER_LABELS, SEMESTER_LABELS, YEAR_LABEL, ViewType } from "@/pages/apps/controle-financeiro/constants/financialConstants";
import { IntegratedTransaction } from "@/pages/apps/controle-financeiro/types/financialStatement";

export interface TransactionData {
  id: string;
  amount: number;
  transaction_date: string;
  transaction_type: string;
  classification?: {
    commitment?: {
      id?: string;
      name: string;
      commitment_group?: {
        id?: string;
        name: string;
        commitment_type?: {
          id?: string;
          name: string;
        };
      };
      commitment_type?: {
        id?: string;
        name: string;
      };
    };
    commitment_group?: {
      id?: string;
      name: string;
      commitment_type?: {
        id?: string;
        name: string;
      };
    };
    commitment_type?: {
      id?: string;
      name: string;
    };
  };
}

export interface DRELine {
  id: string;
  label: string;
  type: "commitment_type" | "commitment_group" | "commitment" | "unclassified";
  level: number;
  values: number[];
  yearValues?: {
    year: number;
    values: number[];
    total: number;
  }[];
  grandTotal?: number;
  expandable?: boolean;
  expanded?: boolean;
  parentId?: string;
  children?: DRELine[];
  itemId?: string;
}

interface CommitmentType {
  id: string;
  name: string;
  company_id: string;
}

interface CommitmentGroup {
  id: string;
  name: string;
  color: string;
  company_id: string;
}

interface Commitment {
  id: string;
  name: string;
  commitment_group_id: string;
  commitment_type_id?: string;
}

export const dreCalculations = {
  /**
   * Gera labels de colunas baseado no tipo de visualização
   */
  getColumnLabels(viewType: ViewType): string[] {
    switch (viewType) {
      case "month":
        return MONTH_NAMES;
      case "quarter":
        return QUARTER_LABELS;
      case "semester":
        return SEMESTER_LABELS;
      case "year":
        return YEAR_LABEL;
      default:
        return MONTH_NAMES;
    }
  },

  /**
   * Converte period_key em índice de coluna
   */
  getPeriodIndex(periodKey: string, viewType: ViewType): number {
    switch (viewType) {
      case "month":
        // "2024-01" → índice 0 (Jan)
        const month = parseInt(periodKey.split("-")[1]);
        return month - 1;
      case "quarter":
        // "2024-Q1" → índice 0
        const quarter = parseInt(periodKey.replace(/.*Q/, ""));
        return quarter - 1;
      case "semester":
        // "2024-S1" → índice 0
        const semester = parseInt(periodKey.replace(/.*S/, ""));
        return semester - 1;
      case "year":
        // "2024" → índice 0 (sempre uma única coluna)
        return 0;
      default:
        return 0;
    }
  },

  /**
   * Formata valor como moeda brasileira
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  /**
   * Converte dados integrados para formato TransactionData
   */
  convertIntegratedToTransactionData(integratedData: IntegratedTransaction[]): TransactionData[] {
    return integratedData.map((row) => ({
      id: row.id,
      amount: row.total_amount,
      transaction_date: row.period_key || row.month_year,
      transaction_type: row.total_amount >= 0 ? "credit" : "debit",
      description: `${row.commitment_name} (${row.transaction_count} transações)`,
      classification: {
        commitment: {
          id: row.commitment_id,
          name: row.commitment_name,
        },
        commitment_group: {
          id: row.commitment_group_id,
          name: row.group_name,
        },
        commitment_type: {
          id: row.commitment_type_id,
          name: row.type_name,
        },
      },
    }));
  },

  /**
   * Processa dados de transações para gerar estrutura DRE hierárquica
   */
  processDataForDRE(transactions: TransactionData[], viewType: ViewType): DRELine[] {
    const columnCount = this.getColumnLabels(viewType).length;

    // Create hierarchical data structure based on commitment types → groups → commitments
    const hierarchyMap = new Map<
      string,
      {
        type: CommitmentType;
        groups: Map<
          string,
          {
            group: CommitmentGroup;
            commitments: Map<
              string,
              {
                commitment: Commitment;
                values: number[];
              }
            >;
            values: number[];
          }
        >;
        values: number[];
      }
    >();

    // Process each transaction
    transactions.forEach((transaction) => {
      const periodIndex = this.getPeriodIndex(transaction.transaction_date, viewType);

      if (periodIndex < 0 || periodIndex >= columnCount) return;

      // Apply debit/credit logic: credits are positive, debits are negative
      const amount =
        transaction.transaction_type === "credit"
          ? Math.abs(transaction.amount)
          : -Math.abs(transaction.amount);

      const classification = transaction.classification;

      let commitmentTypeId: string;
      let commitmentTypeName: string;
      let commitmentGroupId: string;
      let commitmentGroupName: string;
      let commitmentId: string;
      let commitmentName: string;

      if (classification?.commitment) {
        // Full classification with commitment
        commitmentId = classification.commitment.id || "unknown";
        commitmentName = classification.commitment.name;
        commitmentGroupId = classification.commitment_group?.id || "unknown";
        commitmentGroupName = classification.commitment_group?.name || "Grupo Desconhecido";
        commitmentTypeId = classification.commitment_type?.id || "unknown";
        commitmentTypeName = classification.commitment_type?.name || "Tipo Desconhecido";
      } else if (classification?.commitment_group) {
        // Group classification only
        commitmentId = "outros";
        commitmentName = "Outros";
        commitmentGroupId = classification.commitment_group.id || "unknown";
        commitmentGroupName = classification.commitment_group.name;
        commitmentTypeId = classification.commitment_type?.id || "unknown";
        commitmentTypeName = classification.commitment_type?.name || "Tipo Desconhecido";
      } else if (classification?.commitment_type) {
        // Type classification only
        commitmentId = "outros";
        commitmentName = "Outros";
        commitmentGroupId = "outros";
        commitmentGroupName = "Outros";
        commitmentTypeId = classification.commitment_type.id || "unknown";
        commitmentTypeName = classification.commitment_type.name;
      } else {
        // Ignorar transações sem classificação
        return;
      }

      // Initialize type if not exists
      if (!hierarchyMap.has(commitmentTypeId)) {
        hierarchyMap.set(commitmentTypeId, {
          type: {
            id: commitmentTypeId,
            name: commitmentTypeName,
            company_id: "",
          },
          groups: new Map(),
          values: new Array(columnCount).fill(0),
        });
      }
      const typeData = hierarchyMap.get(commitmentTypeId)!;
      typeData.values[periodIndex] += amount;

      // Initialize group if not exists
      if (!typeData.groups.has(commitmentGroupId)) {
        typeData.groups.set(commitmentGroupId, {
          group: {
            id: commitmentGroupId,
            name: commitmentGroupName,
            color: "#6B7280",
            company_id: "",
          },
          commitments: new Map(),
          values: new Array(columnCount).fill(0),
        });
      }
      const groupData = typeData.groups.get(commitmentGroupId)!;
      groupData.values[periodIndex] += amount;

      // Initialize commitment if not exists
      if (!groupData.commitments.has(commitmentId)) {
        groupData.commitments.set(commitmentId, {
          commitment: {
            id: commitmentId,
            name: commitmentName,
            commitment_group_id: commitmentGroupId,
          },
          values: new Array(columnCount).fill(0),
        });
      }
      const commitmentData = groupData.commitments.get(commitmentId)!;
      commitmentData.values[periodIndex] += amount;
    });

    // Create hierarchical DRE structure
    const lines: DRELine[] = [];

    // Build the hierarchical lines
    hierarchyMap.forEach((typeData, typeId) => {
      // Add commitment type line
      lines.push({
        id: `type-${typeId}`,
        label: typeData.type.name,
        type: "commitment_type",
        level: 0,
        values: typeData.values,
        expandable: typeData.groups.size > 0,
        expanded: false,
        itemId: typeId,
      });

      // Add commitment groups
      typeData.groups.forEach((groupData, groupId) => {
        lines.push({
          id: `group-${groupId}`,
          label: `  ${groupData.group.name}`,
          type: "commitment_group",
          level: 1,
          values: groupData.values,
          expandable: groupData.commitments.size > 0,
          expanded: false,
          parentId: `type-${typeId}`,
          itemId: groupId,
        });

        // Add commitments
        groupData.commitments.forEach((commitmentData, commitmentId) => {
          lines.push({
            id: `commitment-${commitmentId}`,
            label: `    ${commitmentData.commitment.name}`,
            type: "commitment",
            level: 2,
            values: commitmentData.values,
            expandable: false,
            parentId: `group-${groupId}`,
            itemId: commitmentId,
          });
        });
      });
    });

    return lines;
  },

  /**
   * Calcula totais mensais das linhas de nível 0
   */
  calculateMonthlyTotals(dreLines: DRELine[], viewType: ViewType): number[] {
    const columnCount = this.getColumnLabels(viewType).length;
    const totals = new Array(columnCount).fill(0);

    dreLines.forEach((line) => {
      if (line.level === 0) {
        line.values.forEach((value, index) => {
          totals[index] += value;
        });
      }
    });

    return totals;
  },

  /**
   * Calcula total geral
   */
  calculateGrandTotal(monthlyTotals: number[]): number {
    return monthlyTotals.reduce((acc, value) => acc + value, 0);
  },

  /**
   * Verifica se uma linha é visível baseado na expansão dos pais
   */
  isLineVisible(line: DRELine, expandedLines: Set<string>, allLines: DRELine[]): boolean {
    if (line.level === 0) return true;
    if (!line.parentId) return true;

    const parentExpanded = expandedLines.has(line.parentId);
    if (!parentExpanded) return false;

    // Check if all parent levels are expanded
    const parentLine = allLines.find((l) => l.id === line.parentId);
    if (parentLine && parentLine.level > 0) {
      return this.isLineVisible(parentLine, expandedLines, allLines);
    }
    return true;
  },

  /**
   * Retorna classe CSS para linha da tabela baseado no tipo e nível
   */
  getRowClassName(type: string, level: number): string {
    let baseClass = "";
    switch (type) {
      case "commitment_type":
        baseClass = level === 0 ? "bg-primary/5 font-bold border-t border-primary/20" : "";
        break;
      case "commitment_group":
        baseClass = "text-card-foreground font-medium bg-secondary/10";
        break;
      case "commitment":
        baseClass = "text-card-foreground";
        break;
      case "unclassified":
        baseClass = "text-card-foreground font-medium bg-warning/10 dark:bg-warning/20";
        break;
      default:
        baseClass = "";
    }
    if (level > 0) {
      baseClass += " hover:bg-secondary/20 transition-colors";
    }
    return baseClass;
  },

  /**
   * Processa dados de múltiplos anos para gerar estrutura DRE comparativa
   */
  processMultiYearDataForDRE(
    allYearsData: IntegratedTransaction[][],
    years: number[],
    viewType: ViewType
  ): DRELine[] {
    if (years.length === 0 || allYearsData.length === 0) return [];

    // Se for apenas um ano, usa o método tradicional
    if (years.length === 1) {
      const transactions = this.convertIntegratedToTransactionData(allYearsData[0] || []);
      return this.processDataForDRE(transactions, viewType);
    }

    const columnCount = this.getColumnLabels(viewType).length;

    // Criar estrutura hierárquica combinando todos os anos
    const hierarchyMap = new Map<
      string,
      {
        type: CommitmentType;
        groups: Map<
          string,
          {
            group: CommitmentGroup;
            commitments: Map<
              string,
              {
                commitment: Commitment;
                yearValues: Map<number, number[]>;
              }
            >;
            yearValues: Map<number, number[]>;
          }
        >;
        yearValues: Map<number, number[]>;
      }
    >();

    // Processar cada ano
    years.forEach((year, yearIndex) => {
      const yearData = allYearsData[yearIndex] || [];
      const transactions = this.convertIntegratedToTransactionData(yearData);

      transactions.forEach((transaction) => {
        const periodIndex = this.getPeriodIndex(transaction.transaction_date, viewType);

        if (periodIndex < 0 || periodIndex >= columnCount) return;

        const amount =
          transaction.transaction_type === "credit"
            ? Math.abs(transaction.amount)
            : -Math.abs(transaction.amount);

        const classification = transaction.classification;

        let commitmentTypeId: string;
        let commitmentTypeName: string;
        let commitmentGroupId: string;
        let commitmentGroupName: string;
        let commitmentId: string;
        let commitmentName: string;

        if (classification?.commitment) {
          commitmentId = classification.commitment.id || "unknown";
          commitmentName = classification.commitment.name;
          commitmentGroupId = classification.commitment_group?.id || "unknown";
          commitmentGroupName = classification.commitment_group?.name || "Grupo Desconhecido";
          commitmentTypeId = classification.commitment_type?.id || "unknown";
          commitmentTypeName = classification.commitment_type?.name || "Tipo Desconhecido";
        } else if (classification?.commitment_group) {
          commitmentId = "outros";
          commitmentName = "Outros";
          commitmentGroupId = classification.commitment_group.id || "unknown";
          commitmentGroupName = classification.commitment_group.name;
          commitmentTypeId = classification.commitment_type?.id || "unknown";
          commitmentTypeName = classification.commitment_type?.name || "Tipo Desconhecido";
        } else if (classification?.commitment_type) {
          commitmentId = "outros";
          commitmentName = "Outros";
          commitmentGroupId = "outros";
          commitmentGroupName = "Outros";
          commitmentTypeId = classification.commitment_type.id || "unknown";
          commitmentTypeName = classification.commitment_type.name;
        } else {
          return;
        }

        // Inicializar tipo se não existir
        if (!hierarchyMap.has(commitmentTypeId)) {
          hierarchyMap.set(commitmentTypeId, {
            type: {
              id: commitmentTypeId,
              name: commitmentTypeName,
              company_id: "",
            },
            groups: new Map(),
            yearValues: new Map(),
          });
        }
        const typeData = hierarchyMap.get(commitmentTypeId)!;

        // Inicializar valores do ano para o tipo
        if (!typeData.yearValues.has(year)) {
          typeData.yearValues.set(year, new Array(columnCount).fill(0));
        }
        typeData.yearValues.get(year)![periodIndex] += amount;

        // Inicializar grupo se não existir
        if (!typeData.groups.has(commitmentGroupId)) {
          typeData.groups.set(commitmentGroupId, {
            group: {
              id: commitmentGroupId,
              name: commitmentGroupName,
              color: "#6B7280",
              company_id: "",
            },
            commitments: new Map(),
            yearValues: new Map(),
          });
        }
        const groupData = typeData.groups.get(commitmentGroupId)!;

        // Inicializar valores do ano para o grupo
        if (!groupData.yearValues.has(year)) {
          groupData.yearValues.set(year, new Array(columnCount).fill(0));
        }
        groupData.yearValues.get(year)![periodIndex] += amount;

        // Inicializar compromisso se não existir
        if (!groupData.commitments.has(commitmentId)) {
          groupData.commitments.set(commitmentId, {
            commitment: {
              id: commitmentId,
              name: commitmentName,
              commitment_group_id: commitmentGroupId,
            },
            yearValues: new Map(),
          });
        }
        const commitmentData = groupData.commitments.get(commitmentId)!;

        // Inicializar valores do ano para o compromisso
        if (!commitmentData.yearValues.has(year)) {
          commitmentData.yearValues.set(year, new Array(columnCount).fill(0));
        }
        commitmentData.yearValues.get(year)![periodIndex] += amount;
      });
    });

    // Criar estrutura hierárquica DRE com múltiplos anos
    const lines: DRELine[] = [];

    hierarchyMap.forEach((typeData, typeId) => {
      // Converter yearValues Map para array de objetos
      const yearValuesArray = years.map((year) => {
        const values = typeData.yearValues.get(year) || new Array(columnCount).fill(0);
        return {
          year,
          values,
          total: values.reduce((sum, val) => sum + val, 0),
        };
      });

      const grandTotal = yearValuesArray.reduce((sum, yv) => sum + yv.total, 0);

      lines.push({
        id: `type-${typeId}`,
        label: typeData.type.name,
        type: "commitment_type",
        level: 0,
        values: yearValuesArray[0]?.values || [],
        yearValues: yearValuesArray,
        grandTotal,
        expandable: typeData.groups.size > 0,
        expanded: false,
        itemId: typeId,
      });

      // Adicionar grupos de compromissos
      typeData.groups.forEach((groupData, groupId) => {
        const groupYearValuesArray = years.map((year) => {
          const values = groupData.yearValues.get(year) || new Array(columnCount).fill(0);
          return {
            year,
            values,
            total: values.reduce((sum, val) => sum + val, 0),
          };
        });

        const groupGrandTotal = groupYearValuesArray.reduce((sum, yv) => sum + yv.total, 0);

        lines.push({
          id: `group-${groupId}`,
          label: `  ${groupData.group.name}`,
          type: "commitment_group",
          level: 1,
          values: groupYearValuesArray[0]?.values || [],
          yearValues: groupYearValuesArray,
          grandTotal: groupGrandTotal,
          expandable: groupData.commitments.size > 0,
          expanded: false,
          parentId: `type-${typeId}`,
          itemId: groupId,
        });

        // Adicionar compromissos
        groupData.commitments.forEach((commitmentData, commitmentId) => {
          const commitmentYearValuesArray = years.map((year) => {
            const values = commitmentData.yearValues.get(year) || new Array(columnCount).fill(0);
            return {
              year,
              values,
              total: values.reduce((sum, val) => sum + val, 0),
            };
          });

          const commitmentGrandTotal = commitmentYearValuesArray.reduce(
            (sum, yv) => sum + yv.total,
            0
          );

          lines.push({
            id: `commitment-${commitmentId}`,
            label: `    ${commitmentData.commitment.name}`,
            type: "commitment",
            level: 2,
            values: commitmentYearValuesArray[0]?.values || [],
            yearValues: commitmentYearValuesArray,
            grandTotal: commitmentGrandTotal,
            expandable: false,
            parentId: `group-${groupId}`,
            itemId: commitmentId,
          });
        });
      });
    });

    return lines;
  },

  /**
   * Calcula totais por período considerando múltiplos anos
   */
  calculateMultiYearMonthlyTotals(
    dreLines: DRELine[],
    years: number[],
    viewType: ViewType
  ): { year: number; totals: number[] }[] {
    const columnCount = this.getColumnLabels(viewType).length;

    return years.map((year) => {
      const totals = new Array(columnCount).fill(0);

      dreLines.forEach((line) => {
        if (line.level === 0 && line.yearValues) {
          const yearData = line.yearValues.find((yv) => yv.year === year);
          if (yearData) {
            yearData.values.forEach((value, index) => {
              totals[index] += value;
            });
          }
        }
      });

      return { year, totals };
    });
  },
};
