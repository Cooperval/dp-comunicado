import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Banco {
  id: string;
  nome: string;
  conta: string;
  saldo_inicial: number;
  data_cadastro: string;
}

interface Movimentacao {
  id: string;
  descricao: string;
  valor: number;
  data_original: string;
  data_sugerida: string | null;
  banco_id: string;
  tipo: 'pagar' | 'receber';
  situacao: 'pendente' | 'realizado';
  bancos: { nome: string };
  created_at: string;
  updated_at: string;
}

interface RelatorioItem {
  data: string;
  descricao: string;
  valor: number;
  banco: string;
  tipo: string;
  situacao: string;
}

interface GrupoRelatorio {
  banco: string;
  tipo: string;
  items: RelatorioItem[];
  total: number;
}

const Relatorios = () => {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState('all');
  const [bancoFilter, setBancoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');

  const fetchData = async () => {
    try {
      const { data: bancosData, error: bancosError } = await supabase
        .from('bancos')
        .select('*')
        .order('nome');

      if (bancosError) throw bancosError;

      const { data: movimentacoesData, error: movimentacoesError } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          bancos (nome)
        `)
        .order('data_original', { ascending: false });

      if (movimentacoesError) throw movimentacoesError;

      setBancos(bancosData || []);
      setMovimentacoes(movimentacoesData as Movimentacao[] || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  // Filtrar movimentações
  const filteredMovimentacoes = movimentacoes.filter(mov => {
    if (dataInicio && mov.data_original < dataInicio) return false;
    if (dataFim && mov.data_original > dataFim) return false;
    if (situacaoFilter && situacaoFilter !== 'all' && mov.situacao !== situacaoFilter) return false;
    if (bancoFilter && bancoFilter !== 'all' && mov.banco_id !== bancoFilter) return false;
    if (tipoFilter && tipoFilter !== 'all' && mov.tipo !== tipoFilter) return false;
    return true;
  });

  // Agrupar por banco e tipo
  const gruposRelatorio: GrupoRelatorio[] = [];
  
  const bancosUnicos = [...new Set(filteredMovimentacoes.map(m => m.banco_id))];
  const tiposUnicos = ['pagar', 'receber'];

  bancosUnicos.forEach(bancoId => {
    const banco = bancos.find(b => b.id === bancoId);
    if (!banco) return;

    tiposUnicos.forEach(tipo => {
      const movsBancoTipo = filteredMovimentacoes.filter(m => 
        m.banco_id === bancoId && m.tipo === tipo
      );

      if (movsBancoTipo.length > 0) {
        const items: RelatorioItem[] = movsBancoTipo.map(m => ({
          data: m.data_original,
          descricao: m.descricao,
          valor: m.valor,
          banco: banco.nome,
          tipo: m.tipo,
          situacao: m.situacao
        }));

        const total = movsBancoTipo.reduce((sum, m) => sum + m.valor, 0);

        gruposRelatorio.push({
          banco: banco.nome,
          tipo: tipo === 'pagar' ? 'A Pagar' : 'A Receber',
          items,
          total
        });
      }
    });
  });

  const exportarCSV = () => {
    const headers = ['Data', 'Descrição', 'Valor', 'Banco', 'Tipo', 'Situação'];
    const csvContent = [
      headers.join(','),
      ...filteredMovimentacoes.map(mov => [
        mov.data_original,
        `"${mov.descricao}"`,
        mov.valor.toFixed(2).replace('.', ','),
        `"${mov.bancos.nome}"`,
        mov.tipo === 'pagar' ? 'A Pagar' : 'A Receber',
        mov.situacao === 'pendente' ? 'Pendente' : 'Realizado'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-movimentacoes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada das suas movimentações financeiras</p>
        </div>
        
        <Button onClick={exportarCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select value={bancoFilter} onValueChange={setBancoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pagar">A Pagar</SelectItem>
                  <SelectItem value="receber">A Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total de Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {filteredMovimentacoes.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(
                filteredMovimentacoes
                  .filter(m => m.tipo === 'receber')
                  .reduce((sum, m) => sum + m.valor, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(
                filteredMovimentacoes
                  .filter(m => m.tipo === 'pagar')
                  .reduce((sum, m) => sum + m.valor, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatório Agrupado */}
      <div className="space-y-6">
        {gruposRelatorio.map((grupo, index) => (
          <Card key={`${grupo.banco}-${grupo.tipo}`}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{grupo.banco} - {grupo.tipo}</span>
                <Badge variant="outline" className="text-lg px-3">
                  Total: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(grupo.total)}
                </Badge>
              </CardTitle>
              <CardDescription>
                {grupo.items.length} movimentação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupo.items.map((item, itemIndex) => (
                    <TableRow key={itemIndex}>
                      <TableCell>
                        {item.data.split('-').reverse().join('/')}
                      </TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          item.tipo === 'receber' ? 'text-success' : 'text-destructive'
                        }`}>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(item.valor)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.situacao === 'realizado' ? 'default' : 'secondary'}>
                          {item.situacao === 'realizado' ? 'Realizado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {gruposRelatorio.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
            <p className="text-muted-foreground text-center">
              Não há movimentações que correspondam aos filtros selecionados.
              Tente ajustar os filtros ou adicionar algumas movimentações.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Relatorios;