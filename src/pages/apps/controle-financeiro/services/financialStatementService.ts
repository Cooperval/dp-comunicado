import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ViewType, ClassificationFilter } from "@/pages/apps/controle-financeiro/constants/financialConstants";
import { 
  IntegratedTransaction, 
  DetailTransaction, 
  ClassificationStats 
} from "@/pages/apps/controle-financeiro/types/financialStatement";

interface FetchTransactionsParams {
  companyId: string;
  branchId?: string;
  year: number;
  viewType: ViewType;
  classificationFilter?: ClassificationFilter;
}

interface FetchDetailTransactionsParams {
  companyId: string;
  commitmentTypeId: string | null;
  commitmentGroupId: string | null;
  commitmentId: string | null;
  startDate: Date;
  endDate: Date;
}

export const financialStatementService = {
  /**
   * Busca anos disponíveis nas transações integradas
   */
  async fetchAvailableYears(companyId: string): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from("integrated_transactions")
        .select("month_year")
        .eq("company_id", companyId)
        .not("month_year", "is", null)
        .gte("month_year", "2020-01-01");

      if (error) {
        return [];
      }

      const yearsArray: number[] = [];

      if (data) {
        data.forEach((t) => {
          if (t.month_year) {
            try {
              const date = parseISO(t.month_year);
              const year = date.getFullYear();
              if (!yearsArray.includes(year)) {
                yearsArray.push(year);
              }
            } catch (e) {
              // Invalid date, skip
            }
          }
        });
      }

      yearsArray.sort((a, b) => b - a);
      return yearsArray;
    } catch (error) {
      return [];
    }
  },

  /**
   * Busca anos disponíveis nas transações (para integração)
   */
  async fetchIntegrationAvailableYears(companyId: string): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("transaction_date")
        .eq("company_id", companyId)
        .order("transaction_date", { ascending: false });

      if (error) {
        return [new Date().getFullYear()];
      }

      if (data && data.length > 0) {
        const years = Array.from(
          new Set(data.map((item) => new Date(item.transaction_date).getFullYear()))
        ).sort((a, b) => b - a);

        return years;
      }

      return [new Date().getFullYear()];
    } catch (error) {
      return [new Date().getFullYear()];
    }
  },

  /**
   * Busca transações integradas já agregadas
   */
  async fetchIntegratedTransactions({
    companyId,
    branchId,
    year,
    viewType,
    classificationFilter = 'all',
  }: FetchTransactionsParams): Promise<IntegratedTransaction[]> {
    try {
      // Se o filtro for 'all', buscar todas as transações
      if (classificationFilter === 'all') {
        let query = supabase
          .from("integrated_transactions")
          .select("*")
          .eq("company_id", companyId)
          .eq("aggregation_type", viewType)
          .like("period_key", viewType === "year" ? year.toString() : `${year}%`);
        
        if (branchId) {
          query = query.eq("branch_id", branchId);
        }
        
        const { data, error } = await query.order("period_key", { ascending: true });

        if (error) throw error;
        return (data as IntegratedTransaction[]) || [];
      }

      // Se o filtro for 'fixo' ou 'variavel', precisamos filtrar por commitments
      // Primeiro buscar os IDs dos commitments com a classificação desejada
      const { data: commitments, error: commitmentsError } = await supabase
        .from("commitments")
        .select("id")
        .eq("classification", classificationFilter)
        .or(`company_id.eq.${companyId},company_id.is.null`);

      if (commitmentsError) throw commitmentsError;

      const commitmentIds = commitments?.map(c => c.id) || [];

      // Se não há commitments com essa classificação, retornar array vazio
      if (commitmentIds.length === 0) {
        return [];
      }

      // Buscar transações integradas que correspondem a esses commitments
      let query = supabase
        .from("integrated_transactions")
        .select("*")
        .eq("company_id", companyId)
        .eq("aggregation_type", viewType)
        .like("period_key", viewType === "year" ? year.toString() : `${year}%`)
        .in("commitment_id", commitmentIds);
      
      if (branchId) {
        query = query.eq("branch_id", branchId);
      }
      
      const { data, error } = await query.order("period_key", { ascending: true });

      if (error) throw error;

      return (data as IntegratedTransaction[]) || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca transações detalhadas para um commitment específico
   */
  async fetchDetailTransactions({
    companyId,
    commitmentTypeId,
    commitmentGroupId,
    commitmentId,
    startDate,
    endDate,
  }: FetchDetailTransactionsParams): Promise<DetailTransaction[]> {
    try {
      let query = supabase
        .from("transaction_classifications")
        .select(
          `
          id,
          classification_date,
          transactions!inner(
            id,
            description,
            amount,
            transaction_date,
            transaction_type,
            memo
          )
        `
        )
        .eq("transactions.company_id", companyId)
        .gte("transactions.transaction_date", format(startDate, "yyyy-MM-dd"))
        .lte("transactions.transaction_date", format(endDate, "yyyy-MM-dd"));

      // Filtrar por nível hierárquico
      if (commitmentId) {
        query = query.eq("commitment_id", commitmentId);
      } else if (commitmentGroupId) {
        query = query.eq("commitment_group_id", commitmentGroupId);
      } else if (commitmentTypeId) {
        query = query.eq("commitment_type_id", commitmentTypeId);
      }

      const { data, error } = await query.order("transactions(transaction_date)", {
        ascending: false,
      });

      if (error) throw error;

      const processedTransactions: DetailTransaction[] =
        data?.map((item: any) => ({
          id: item.transactions.id,
          description: item.transactions.description,
          memo: item.transactions.memo,
          amount: item.transactions.amount,
          transaction_date: item.transactions.transaction_date,
          transaction_type: item.transactions.transaction_type as 'credit' | 'debit',
        })) || [];

      return processedTransactions;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca estatísticas de classificação de transações
   */
  async fetchClassificationStats(companyId: string): Promise<ClassificationStats> {
    try {
      // Buscar total de transações
      const { count: totalCount, error: totalError } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      if (totalError) throw totalError;

      // Buscar transações classificadas
      const { data: classifiedData, error: classifiedError } = await supabase
        .from("transaction_classifications")
        .select("transaction_id, transactions!inner(company_id)")
        .eq("transactions.company_id", companyId);

      if (classifiedError) throw classifiedError;

      const totalTransactions = totalCount || 0;
      const classifiedTransactions = classifiedData?.length || 0;
      const unclassified = totalTransactions - classifiedTransactions;

      return {
        totalCount: totalTransactions,
        classifiedCount: classifiedTransactions,
        unclassifiedCount: unclassified,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca configurações de linhas DRE
   */
  async fetchConfigurations() {
    try {
      const { data: configData, error: configError } = await supabase
        .from("dre_line_configurations")
        .select("*");

      if (configError) throw configError;

      const dreConfigs =
        configData?.map((config) => ({
          ...config,
          line_type: config.line_type as "revenue" | "cost" | "expense",
        })) || [];

      return {
        groups: [],
        commitments: [],
        commitmentTypes: [],
        dreConfigurations: dreConfigs,
      };
    } catch (error) {
      return {
        groups: [],
        commitments: [],
        commitmentTypes: [],
        dreConfigurations: [],
      };
    }
  },
};
