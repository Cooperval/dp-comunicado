import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/components/auth/controle-financeiro/AuthProvider';

interface Transaction {
  id: string;
  transaction_date: string;
  amount: number;
  description: string;
  transaction_type: 'debit' | 'credit';
  memo?: string;
  fitid?: string;
  banks: {
    bank_name: string;
    account_number: string;
    bank_code: string;
  };
}

interface Bank {
  id: string;
  bank_name: string;
  account_number: string;
  bank_code: string;
}

const Transactions = () => {
  const { companyId } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset page quando filtros mudarem, mas NÃO recarregar dados
  useEffect(() => {
    if (hasSearched && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedBank, selectedType, selectedYear, selectedMonths]);

  // Recarregar apenas quando paginação mudar (se já houver buscado)
  useEffect(() => {
    if (hasSearched) {
      fetchData();
      fetchSummary().then(setSummary);
    }
  }, [currentPage, itemsPerPage]);

  // Carregar anos disponíveis ao montar o componente
  useEffect(() => {
    if (companyId) {
      fetchAvailableYears();
    }
  }, [companyId]);

  // Real-time updates for transactions and uploads
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
  }, [hasSearched]);

  const fetchData = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);

      // Fetch banks
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('id, bank_name, account_number, bank_code')
        .eq('company_id', companyId)
        .order('bank_name');

      if (banksError) throw banksError;
      setBanks(banksData || []);

      // Build filters
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
        .eq('company_id', companyId);

      // Apply filters
      if (selectedBank !== 'all') {
        query = query.eq('banks.bank_code', selectedBank);
      }
      if (selectedType !== 'all') {
        query = query.eq('transaction_type', selectedType);
      }
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,memo.ilike.%${searchTerm}%`);
      }

      // Filtrar pelo ano inteiro primeiro
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      query = query.gte('transaction_date', yearStart).lte('transaction_date', yearEnd);

      // Buscar TODAS as transações sem paginação
      const { data: transactionsData, error: transactionsError } = await query
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100000);

      if (transactionsError) throw transactionsError;
      
      // Type cast transaction_type to ensure proper typing
      const typedTransactions = (transactionsData || []).map(transaction => ({
        ...transaction,
        transaction_type: transaction.transaction_type as 'debit' | 'credit'
      }));
      
      // 1. PRIMEIRO: Filtrar por meses específicos
      let filteredByMonths = typedTransactions;
      if (selectedMonths.length > 0) {
        filteredByMonths = typedTransactions.filter((transaction) => {
          const transactionMonth = new Date(transaction.transaction_date).getMonth() + 1;
          return selectedMonths.includes(transactionMonth);
        });
      }

      // 2. DEPOIS: Aplicar paginação no lado do cliente
      const totalFiltered = filteredByMonths.length;
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage;
      const paginatedTransactions = filteredByMonths.slice(from, to);

      setTransactions(paginatedTransactions);
      setTotalItems(totalFiltered);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as transações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    if (!companyId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("transaction_date")
        .eq("company_id", companyId)
        .order("transaction_date", { ascending: false });

      if (error) {
        console.error("Erro ao buscar anos disponíveis:", error);
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
      console.error("Error in fetchAvailableYears:", error);
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const handleSearch = async () => {
    // Validar se pelo menos um mês foi selecionado
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
  };

  // Fetch summary data separately (for filtered results)
  const fetchSummary = async () => {
    if (!companyId) return { totalCredit: 0, totalDebit: 0, totalCount: 0 };
    
    try {
      // Build the exact same query as fetchData but without pagination
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
        .eq('company_id', companyId);

      // Apply EXACTLY the same filters as main query
      if (selectedBank !== 'all') {
        query = query.eq('banks.bank_code', selectedBank);
      }
      if (selectedType !== 'all') {
        query = query.eq('transaction_type', selectedType);
      }
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,memo.ilike.%${searchTerm}%`);
      }

      // Filtrar pelo ano inteiro
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      query = query.gte('transaction_date', yearStart).lte('transaction_date', yearEnd);

      // Set explicit high limit to get all filtered transactions (Supabase defaults to 1000)
      const { data } = await query.limit(100000);
      
      if (!data) return { totalCredit: 0, totalDebit: 0, totalCount: 0 };

      // Filtrar por meses específicos no lado do cliente
      let filteredData = data;
      if (selectedMonths.length > 0) {
        filteredData = data.filter((transaction) => {
          const transactionMonth = new Date(transaction.transaction_date).getMonth() + 1;
          return selectedMonths.includes(transactionMonth);
        });
      }

      const totalCredit = filteredData.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + t.amount, 0);
      const totalDebit = filteredData.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + t.amount, 0);
      
      return { totalCredit, totalDebit, totalCount: filteredData.length };
    } catch (error) {
      console.error('Error fetching summary:', error);
      return { totalCredit: 0, totalDebit: 0, totalCount: 0 };
    }
  };

  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, totalCount: 0 });

  const netAmount = summary.totalCredit - summary.totalDebit;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const csvData = transactions.map(t => ({
      Data: format(parseISO(t.transaction_date), 'dd/MM/yyyy'),
      Descrição: t.description,
      Valor: t.amount,
      Tipo: t.transaction_type === 'credit' ? 'Crédito' : 'Débito',
      Banco: t.banks.bank_name,
      'Número da Conta': t.banks.account_number,
      Memo: t.memo || '',
      'ID Transação': t.fitid || ''
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimentacoes_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Créditos</p>
                <p className="text-xl font-bold text-success">
                  R$ {summary.totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  R$ {summary.totalDebit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  R$ {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Linha 1: Busca, Banco, Tipo */}
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
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Linha 2: Ano e Meses */}
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
                {[
                  { num: 1, label: "Jan" },
                  { num: 2, label: "Fev" },
                  { num: 3, label: "Mar" },
                  { num: 4, label: "Abr" },
                  { num: 5, label: "Mai" },
                  { num: 6, label: "Jun" },
                  { num: 7, label: "Jul" },
                  { num: 8, label: "Ago" },
                  { num: 9, label: "Set" },
                  { num: 10, label: "Out" },
                  { num: 11, label: "Nov" },
                  { num: 12, label: "Dez" },
                ].map((month) => (
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
                  onClick={() => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
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

          {/* Linha 3: Botão Buscar */}
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

      {/* Transactions List */}
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
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={exportToCSV}>
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
                          R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
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