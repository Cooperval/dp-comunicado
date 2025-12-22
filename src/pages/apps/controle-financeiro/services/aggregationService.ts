import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { AGGREGATION_TYPES } from "@/pages/apps/controle-financeiro/constants/dreConstants";

interface IntegrateDataParams {
  companyId: string;
  year: number;
  selectedMonths: number[];
}

interface AggregationData {
  commitment_type_id: string | null;
  commitment_group_id: string | null;
  commitment_id: string | null;
  type_name: string;
  group_name: string;
  commitment_name: string;
  total_amount: number;
  transaction_count: number;
}

export const aggregationService = {
  /**
   * Calcula o trimestre baseado no mês
   */
  getQuarter(month: number): number {
    return Math.floor((month - 1) / 3) + 1;
  },

  /**
   * Calcula o semestre baseado no mês
   */
  getSemester(month: number): number {
    return month <= 6 ? 1 : 2;
  },

  /**
   * Adiciona transação à agregação multi-nível
   */
  addToAggregation(
    multiLevelAggregations: Map<string, Map<string, Map<string, AggregationData>>>,
    aggregationType: string,
    periodKey: string,
    commitmentKey: string,
    item: any,
    amount: number
  ) {
    const levelMap = multiLevelAggregations.get(aggregationType)!;

    if (!levelMap.has(periodKey)) {
      levelMap.set(periodKey, new Map());
    }

    const periodMap = levelMap.get(periodKey)!;

    if (!periodMap.has(commitmentKey)) {
      periodMap.set(commitmentKey, {
        commitment_type_id: item.commitment_type_id,
        commitment_group_id: item.commitment_group_id,
        commitment_id: item.commitment_id,
        type_name: item.commitment_types?.name || "Não classificado",
        group_name: item.commitment_groups?.name || "Não classificado",
        commitment_name: item.commitments?.name || "Não classificado",
        total_amount: 0,
        transaction_count: 0,
      });
    }

    const agg = periodMap.get(commitmentKey)!;
    agg.total_amount += amount;
    agg.transaction_count += 1;
  },

  /**
   * Busca transações classificadas para um período
   */
  async fetchClassifiedTransactions(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const { data: classifiedTransactions, error: fetchError } = await supabase
      .from("transaction_classifications")
      .select(
        `
        commitment_type_id,
        commitment_group_id,
        commitment_id,
        transaction_id,
        transactions!inner(
          amount,
          transaction_date,
          transaction_type,
          company_id
        ),
        commitment_types(name),
        commitment_groups(name),
        commitments(name)
      `
      )
      .eq("transactions.company_id", companyId)
      .gte("transactions.transaction_date", format(startDate, "yyyy-MM-dd"))
      .lte("transactions.transaction_date", format(endDate, "yyyy-MM-dd"));

    if (fetchError) {
      throw fetchError;
    }

    return classifiedTransactions || [];
  },

  /**
   * Processa e agrega transações em todos os níveis (mês, trimestre, semestre, ano)
   */
  processTransactionsForAllLevels(
    classifiedTransactions: any[]
  ): Map<string, Map<string, Map<string, AggregationData>>> {
    const multiLevelAggregations = new Map<
      string,
      Map<string, Map<string, AggregationData>>
    >();

    // Initialize aggregation levels
    AGGREGATION_TYPES.forEach((level) => {
      multiLevelAggregations.set(level, new Map());
    });

    // Process each transaction and aggregate at all levels
    for (const item of classifiedTransactions) {
      const transactionDate = new Date(item.transactions.transaction_date);
      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();

      const quarter = this.getQuarter(transactionMonth);
      const semester = this.getSemester(transactionMonth);

      const commitmentKey = `${item.commitment_type_id || "null"}_${item.commitment_group_id || "null"}_${item.commitment_id || "null"}`;

      const amount =
        item.transactions.transaction_type === "credit"
          ? Math.abs(Number(item.transactions.amount))
          : -Math.abs(Number(item.transactions.amount));

      // Aggregate in MONTH
      const monthKey = `${transactionYear}-${String(transactionMonth).padStart(2, "0")}`;
      this.addToAggregation(
        multiLevelAggregations,
        "month",
        monthKey,
        commitmentKey,
        item,
        amount
      );

      // Aggregate in QUARTER
      const quarterKey = `${transactionYear}-Q${quarter}`;
      this.addToAggregation(
        multiLevelAggregations,
        "quarter",
        quarterKey,
        commitmentKey,
        item,
        amount
      );

      // Aggregate in SEMESTER
      const semesterKey = `${transactionYear}-S${semester}`;
      this.addToAggregation(
        multiLevelAggregations,
        "semester",
        semesterKey,
        commitmentKey,
        item,
        amount
      );

      // Aggregate in YEAR
      const yearKey = `${transactionYear}`;
      this.addToAggregation(
        multiLevelAggregations,
        "year",
        yearKey,
        commitmentKey,
        item,
        amount
      );
    }

    return multiLevelAggregations;
  },

  /**
   * Prepara registros para inserção no banco
   */
  prepareIntegrationsForUpsert(
    multiLevelAggregations: Map<string, Map<string, Map<string, AggregationData>>>,
    companyId: string
  ): any[] {
    const integrationsToInsert: any[] = [];

    multiLevelAggregations.forEach((periodMap, aggregationType) => {
      periodMap.forEach((commitmentMap, periodKey) => {
        commitmentMap.forEach((agg, commitmentKey) => {
          // Calculate month_year for backwards compatibility
          let monthYear: string;
          if (aggregationType === "month") {
            monthYear = `${periodKey}-01`;
          } else {
            // For non-month types, use first day of year
            const year = periodKey.split("-")[0];
            monthYear = `${year}-01-01`;
          }

          integrationsToInsert.push({
            company_id: companyId,
            aggregation_type: aggregationType,
            period_key: periodKey,
            month_year: monthYear,
            commitment_type_id: agg.commitment_type_id,
            commitment_group_id: agg.commitment_group_id,
            commitment_id: agg.commitment_id,
            type_name: agg.type_name,
            group_name: agg.group_name,
            commitment_name: agg.commitment_name,
            total_amount: agg.total_amount,
            transaction_count: agg.transaction_count,
          });
        });
      });
    });

    return integrationsToInsert;
  },

  /**
   * Integra dados de transações classificadas
   */
  async integrateData({
    companyId,
    year,
    selectedMonths,
  }: IntegrateDataParams): Promise<void> {
    if (selectedMonths.length === 0) {
      toast({
        title: "Nenhum mês selecionado",
        description: "Por favor, selecione pelo menos um mês para integrar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Process entire year at once
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      // Fetch all classified transactions for the year
      const classifiedTransactions = await this.fetchClassifiedTransactions(
        companyId,
        startDate,
        endDate
      );

      // Process transactions and aggregate at all levels
      const multiLevelAggregations =
        this.processTransactionsForAllLevels(classifiedTransactions);

      // Prepare all integrations to insert
      const integrationsToInsert = this.prepareIntegrationsForUpsert(
        multiLevelAggregations,
        companyId
      );

      // Upsert all aggregations
      if (integrationsToInsert.length > 0) {
        const { error: upsertError } = await supabase
          .from("integrated_transactions")
          .upsert(integrationsToInsert, {
            onConflict:
              "company_id,period_key,aggregation_type,commitment_type_id,commitment_group_id,commitment_id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          throw upsertError;
        }
      }

      toast({
        title: "Integração concluída",
        description: `Dados do ano ${year} foram integrados com sucesso em todos os níveis (mês, trimestre, semestre, ano).`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na integração",
        description: error.message || "Ocorreu um erro ao integrar os dados.",
        variant: "destructive",
      });
      throw error;
    }
  },
};
