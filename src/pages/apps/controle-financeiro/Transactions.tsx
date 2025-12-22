import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Building2,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { formatCurrency } from '@/pages/apps/controle-financeiro/utils/formatters';
import { 
  ITEMS_PER_PAGE_OPTIONS, 
  DEFAULT_ITEMS_PER_PAGE, 
  TRANSACTION_TYPE_OPTIONS, 
  MONTH_BUTTONS,
  ALL_MONTHS 
} from '@/pages/apps/controle-financeiro/constants/transactionsConstants';
import type { Transaction, Bank, TransactionSummary } from '@/pages/apps/controle-financeiro/types/transactions';
import { CompanyBranchFilter } from '@/pages/apps/controle-financeiro/components/filters/CompanyBranchFilter';
import { useCompanyBranchFilter } from '@/pages/apps/controle-financeiro/hooks/useCompanyBranchFilter';

const Transactions = () => {
  const { companyId } = useAuth();
  
  // Company and Branch filter
  const companyBranchFilter = useCompanyBranchFilter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [summary, setSummary] = useState<TransactionSummary>({ totalCredit: 0, totalDebit: 0, totalCount: 0 });

  // Data fetching functions
  const fetchData = useCallback(async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);

      let query = supabase
        .from('transactions')
        .select(`
          id,
          transaction_date,
          amount,
          description,
          transaction_type,
          memo,
          fitid,
          banks!inner (
            bank_name,
            account_number,
            bank_code
          )
        `)
        .eq('company_id', companyBranchFilter.selectedCompanyId || companyId);
      
      if (companyBranchFilter.selectedBranchId) {
        query = query.eq('branch_id', companyBranchFilter.selectedBranchId);
      }

      if (selectedBank !== 'all') {
        query = query.eq('banks.bank_code', selectedBank);
      }
      if (selectedType !== 'all') {
        query = query.eq('transaction_type', selectedType);
      }
      // Search term will be filtered on client-side

      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      query = query.gte('transaction_date', yearStart).lte('transaction_date', yearEnd);

      const { data: transactionsData, error: transactionsError } = await query
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100000);

      if (transactionsError) throw transactionsError;
      
      const typedTransactions = (transactionsData || []).map(transaction => ({
        ...transaction,
        transaction_type: transaction.transaction_type as 'debit' | 'credit'
      }));
      
      let filtered = typedTransactions;

      // First, filter by search term (description or memo)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter((transaction) => 
          transaction.description?.toLowerCase().includes(searchLower) ||
          (transaction.memo && transaction.memo.toLowerCase().includes(searchLower))
        );
      }

      // Then, filter by selected months
      if (selectedMonths.length > 0) {
        filtered = filtered.filter((transaction) => {
          const transactionMonth = new Date(transaction.transaction_date).getMonth() + 1;
          return selectedMonths.includes(transactionMonth);
        });
      }

      const totalFiltered = filtered.length;
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage;
      const paginatedTransactions = filtered.slice(from, to);

      setTransactions(paginatedTransactions);
      setTotalItems(totalFiltered);

    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as transações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, companyBranchFilter.selectedCompanyId, companyBranchFilter.selectedBranchId, selectedBank, selectedType, searchTerm, selectedYear, selectedMonths, currentPage, itemsPerPage]);

  const fetchAvailableYears = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("transactions")
        .select("transaction_date")
        .eq("company_id", companyBranchFilter.selectedCompanyId || companyId);

      if (companyBranchFilter.selectedBranchId) {
        query = query.eq('branch_id', companyBranchFilter.selectedBranchId);
      }

      const { data, error } = await query.order("transaction_date", { ascending: false });

      if (error) {
        toast({
          title: "Erro ao buscar anos",
          description: "Não foi possível carregar os anos disponíveis",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        const years = Array.from(
          new Set(data.map((item) => new Date(item.transaction_date).getFullYear()))
        ).sort((a, b) => b - a);

        setAvailableYears(years);

        if (years.length > 0 && !years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }
      } else {
        setAvailableYears([new Date().getFullYear()]);
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar anos",
        description: "Não foi possível carregar os anos disponíveis",
        variant: "destructive"
      });
      setAvailableYears([new Date().getFullYear()]);
    }
  }, [companyId, companyBranchFilter.selectedCompanyId, companyBranchFilter.selectedBranchId, selectedYear]);

  const fetchSummary = useCallback(async (): Promise<TransactionSummary> => {
    if (!companyId) return { totalCredit: 0, totalDebit: 0, totalCount: 0 };
    
    try {
      let query = supabase
        .from('transactions')
        .select(`
          amount, 
          transaction_type,
          description,
          memo,
          transaction_date,
          banks!inner (
            bank_name,
            account_number,
            bank_code
          )
        `)
        .eq('company_id', companyBranchFilter.selectedCompanyId || companyId);

      if (companyBranchFilter.selectedBranchId) {
        query = query.eq('branch_id', companyBranchFilter.selectedBranchId);
      }

      if (selectedBank !== 'all') {
        query = query.eq('banks.bank_code', selectedBank);
      }
      if (selectedType !== 'all') {
        query = query.eq('transaction_type', selectedType);
      }
      // Search term will be filtered on client-side

      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      query = query.gte('transaction_date', yearStart).lte('transaction_date', yearEnd);

      const { data } = await query.limit(100000);
      
      if (!data) return { totalCredit: 0, totalDebit: 0, totalCount: 0 };

      let filteredData = data;

      // First, filter by search term (description or memo)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        filteredData = filteredData.filter((transaction) => 
          transaction.description?.toLowerCase().includes(searchLower) ||
          (transaction.memo && transaction.memo.toLowerCase().includes(searchLower))
        );
      }

      // Then, filter by selected months
      if (selectedMonths.length > 0) {
        filteredData = filteredData.filter((transaction) => {
          const transactionMonth = new Date(transaction.transaction_date).getMonth() + 1;
          return selectedMonths.includes(transactionMonth);
        });
      }

      const totalCredit = filteredData.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + t.amount, 0);
      const totalDebit = filteredData.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + t.amount, 0);
      
      return { totalCredit, totalDebit, totalCount: filteredData.length };
    } catch (error) {
      toast({
        title: "Erro ao calcular resumo",
        description: "Não foi possível calcular o resumo das transações",
        variant: "destructive"
      });
      return { totalCredit: 0, totalDebit: 0, totalCount: 0 };
    }
  }, [companyId, companyBranchFilter.selectedCompanyId, companyBranchFilter.selectedBranchId, selectedBank, selectedType, searchTerm, selectedYear, selectedMonths]);

  const handleSearch = useCallback(async () => {
    if (selectedMonths.length === 0) {
      toast({
        title: "Meses obrigatórios",
        description: "Por favor, selecione pelo menos um mês para buscar as transações.",
        variant: "destructive",
      });
      return;
    }
    
    setHasSearched(true);
    setCurrentPage(1);
    await fetchData();
    const summaryData = await fetchSummary();
    setSummary(summaryData);
  }, [selectedMonths, fetchData, fetchSummary]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }, []);

  const exportToCSV = useCallback(() => {
    const escapeCSV = (value: string | number) => {
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvData = transactions.map(t => ({
      Data: format(parseISO(t.transaction_date), 'dd/MM/yyyy'),
      Descrição: escapeCSV(t.description),
      Valor: t.amount,
      Tipo: t.transaction_type === 'credit' ? 'Crédito' : 'Débito',
      Banco: escapeCSV(t.banks.bank_name),
      'Número da Conta': t.banks.account_number,
      Memo: escapeCSV(t.memo || ''),
      'ID Transação': t.fitid || ''
    }));

    const headers = Object.keys(csvData[0]);
    const csvString = [
      headers.join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimentacoes_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [transactions]);

  const netAmount = useMemo(() => summary.totalCredit - summary.totalDebit, [summary]);
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  // Effects
  useEffect(() => {
    const fetchBanks = async () => {
      if (!companyId) return;
      
      try {
        let query = supabase
          .from('banks')
          .select('id, bank_name, account_number, bank_code')
          .eq('company_id', companyBranchFilter.selectedCompanyId || companyId);

        if (companyBranchFilter.selectedBranchId) {
          query = query.eq('branch_id', companyBranchFilter.selectedBranchId);
        }

        const { data: banksData, error: banksError } = await query.order('bank_name');

        if (banksError) throw banksError;
        setBanks(banksData || []);
      } catch (error) {
        toast({
          title: "Erro ao carregar bancos",
          description: "Não foi possível carregar a lista de bancos",
          variant: "destructive"
        });
      }
    };
    
    fetchBanks();
  }, [companyId, companyBranchFilter.selectedCompanyId, companyBranchFilter.selectedBranchId]);

  useEffect(() => {
    if (hasSearched && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedBank, selectedType, selectedYear, selectedMonths, hasSearched, currentPage]);

  useEffect(() => {
    if (hasSearched) {
      fetchData();
      fetchSummary().then(setSummary);
    }
  }, [currentPage, itemsPerPage, hasSearched, fetchData, fetchSummary]);

  useEffect(() => {
    if (companyId) {
      fetchAvailableYears();
    }
  }, [companyId, fetchAvailableYears]);

  useEffect(() => {
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          if (hasSearched) {
            fetchData();
            fetchSummary().then(setSummary);
            fetchAvailableYears();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ofx_uploads'
        },
        () => {
          if (hasSearched) {
            fetchData();
            fetchSummary().then(setSummary);
            fetchAvailableYears();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasSearched, fetchData, fetchSummary, fetchAvailableYears]);

  return (
    <div className="space-y-6">
      {hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Créditos</p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(summary.totalCredit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Total Débitos</p>
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(summary.totalDebit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                <p className={`text-xl font-bold ${netAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(netAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Transações</p>
                <p className="text-xl font-bold">
                  {totalItems}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CompanyBranchFilter
            companies={companyBranchFilter.companies}
            branches={companyBranchFilter.branches}
            selectedCompanyId={companyBranchFilter.selectedCompanyId}
            selectedBranchId={companyBranchFilter.selectedBranchId}
            onCompanyChange={companyBranchFilter.handleCompanyChange}
            onBranchChange={companyBranchFilter.handleBranchChange}
            loading={companyBranchFilter.loading}
          />

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-1 lg:col-span-2">
              <label className="text-sm font-medium">Banco</label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os bancos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bancos</SelectItem>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.bank_code}>
                      {bank.bank_name} ({bank.account_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-1 lg:col-span-1">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium min-w-[60px]">Período:</Label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
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
              <Label className="text-sm font-medium">Meses:</Label>
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
                {MONTH_BUTTONS.map((month) => (
                  <Button
                    key={month.num}
                    type="button"
                    variant={selectedMonths.includes(month.num) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedMonths((prev) =>
                        prev.includes(month.num)
                          ? prev.filter((m) => m !== month.num)
                          : [...prev, month.num].sort((a, b) => a - b)
                      );
                    }}
                    className="h-9"
                  >
                    {month.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonths(ALL_MONTHS)}
                  className="flex-1"
                >
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonths([])}
                  className="flex-1"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button 
              onClick={handleSearch} 
              className="w-full sm:w-auto min-w-[140px]"
              disabled={loading || selectedMonths.length === 0}
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transações</CardTitle>
              <CardDescription>
                {totalItems} transação(ões) encontrada(s) - Página {currentPage} de {totalPages}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Exibir:</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={exportToCSV} disabled={transactions.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : !hasSearched ? (
              <div className="text-center py-12 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma transação carregada</p>
                <p className="text-sm">Selecione os filtros acima e clique em "Buscar"</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{transaction.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.banks.bank_name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                          {transaction.memo && ` • ${transaction.memo}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Conta: {transaction.banks.account_number}
                          {transaction.fitid && ` • ID: ${transaction.fitid}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={transaction.transaction_type === 'credit' ? 'default' : 'destructive'}
                          className="text-base px-3 py-1"
                        >
                          {transaction.transaction_type === 'credit' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} transações
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage <= 3 ? i + 1 : 
                                    currentPage >= totalPages - 2 ? totalPages - 4 + i :
                                    currentPage - 2 + i;
                        
                        if (page < 1 || page > totalPages) return null;
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
