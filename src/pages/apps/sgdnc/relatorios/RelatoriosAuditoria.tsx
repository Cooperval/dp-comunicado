import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileDown, CalendarIcon, BarChart3, FileText, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type TipoRelatorio =
  | 'trilha-auditoria'
  | 'ncs-periodo'
  | 'documentos-vencidos'
  | 'relatorio-mapa'
  | 'exportacao-china'
  | 'auditoria-iso';

export default function RelatoriosAuditoria() {
  const navigate = useNavigate();
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('trilha-auditoria');
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [departamento, setDepartamento] = useState<string>('todos');
  const [categoria, setCategoria] = useState<string>('todas');

  const tiposRelatorio = [
    { value: 'trilha-auditoria', label: 'Trilha de Auditoria', icon: FileText },
    { value: 'ncs-periodo', label: 'NCs por Período', icon: BarChart3 },
    { value: 'documentos-vencidos', label: 'Documentos Vencidos', icon: FileText },
    { value: 'relatorio-mapa', label: 'Relatório MAPA', icon: FileDown },
    { value: 'exportacao-china', label: 'Relatório Exportação China', icon: TrendingUp },
    { value: 'auditoria-iso', label: 'Auditoria Interna ISO', icon: FileText },
  ];

  const departamentos = [
    { value: 'todos', label: 'Todos os Departamentos' },
    { value: 'qualidade', label: 'Qualidade' },
    { value: 'producao', label: 'Produção' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'administrativo', label: 'Administrativo' },
  ];

  const categorias = [
    { value: 'todas', label: 'Todas as Categorias' },
    { value: 'produto', label: 'Produto' },
    { value: 'processo', label: 'Processo' },
    { value: 'documental', label: 'Documental' },
    { value: 'hse', label: 'HSE' },
  ];

  // Mock data para preview
  const getDadosPreview = () => {
    switch (tipoRelatorio) {
      case 'trilha-auditoria':
        return [
          {
            id: '001',
            acao: 'Documento visualizado',
            usuario: 'João Silva',
            data: '2024-01-15',
            documento: 'POP-001',
          },
          {
            id: '002',
            acao: 'NC registrada',
            usuario: 'Maria Santos',
            data: '2024-01-16',
            documento: 'NC-2024-001',
          },
          {
            id: '003',
            acao: 'Documento editado',
            usuario: 'Carlos Oliveira',
            data: '2024-01-17',
            documento: 'POP-002',
          },
        ];
      case 'ncs-periodo':
        return [
          { id: 'NC-001', titulo: 'Desvio na temperatura', status: 'Resolvida', severidade: 'Alta' },
          { id: 'NC-002', titulo: 'Documentação incompleta', status: 'Aberta', severidade: 'Média' },
          { id: 'NC-003', titulo: 'Equipamento sem calibração', status: 'Em Análise', severidade: 'Crítica' },
        ];
      case 'documentos-vencidos':
        return [
          { id: 'DOC-001', titulo: 'Certificado ISO 9001', vencimento: '2024-02-01', dias: '15' },
          { id: 'DOC-002', titulo: 'Licença Ambiental', vencimento: '2024-03-15', dias: '58' },
          { id: 'DOC-003', titulo: 'Registro MAPA', vencimento: '2024-01-20', dias: '3' },
        ];
      default:
        return [];
    }
  };

  const getColunasPreview = () => {
    switch (tipoRelatorio) {
      case 'trilha-auditoria':
        return ['ID', 'Ação', 'Usuário', 'Data', 'Documento'];
      case 'ncs-periodo':
        return ['ID', 'Título', 'Status', 'Severidade'];
      case 'documentos-vencidos':
        return ['ID', 'Título', 'Vencimento', 'Dias Restantes'];
      default:
        return [];
    }
  };

  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Logo (placeholder - você pode adicionar uma imagem real)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SGDNC', 14, 20);

      // Título do relatório
      doc.setFontSize(16);
      const tipoSelecionado = tiposRelatorio.find((t) => t.value === tipoRelatorio);
      doc.text(tipoSelecionado?.label || 'Relatório', 14, 35);

      // Período
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodoText = dataInicio && dataFim
        ? `Período: ${format(dataInicio, 'dd/MM/yyyy')} a ${format(dataFim, 'dd/MM/yyyy')}`
        : 'Período: Todos os registros';
      doc.text(periodoText, 14, 45);

      // Filtros aplicados
      let yPosition = 50;
      if (departamento !== 'todos') {
        const dept = departamentos.find((d) => d.value === departamento);
        doc.text(`Departamento: ${dept?.label}`, 14, yPosition);
        yPosition += 5;
      }
      if (categoria !== 'todas') {
        const cat = categorias.find((c) => c.value === categoria);
        doc.text(`Categoria: ${cat?.label}`, 14, yPosition);
        yPosition += 5;
      }

      yPosition += 5;

      // Tabela de dados
      const dados = getDadosPreview();
      const colunas = getColunasPreview();

      const tableData = dados.map((item: any) => {
        switch (tipoRelatorio) {
          case 'trilha-auditoria':
            return [item.id, item.acao, item.usuario, item.data, item.documento];
          case 'ncs-periodo':
            return [item.id, item.titulo, item.status, item.severidade];
          case 'documentos-vencidos':
            return [item.id, item.titulo, item.vencimento, item.dias];
          default:
            return [];
        }
      });

      autoTable(doc, {
        startY: yPosition,
        head: [colunas],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
      });

      // Estatísticas (se houver espaço)
      const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
      
      if (finalY < pageHeight - 60) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo Estatístico', 14, finalY + 15);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de registros: ${dados.length}`, 14, finalY + 25);
        
        if (tipoRelatorio === 'ncs-periodo') {
          const abertas = dados.filter((d: any) => d.status === 'Aberta').length;
          const resolvidas = dados.filter((d: any) => d.status === 'Resolvida').length;
          doc.text(`NCs Abertas: ${abertas}`, 14, finalY + 32);
          doc.text(`NCs Resolvidas: ${resolvidas}`, 14, finalY + 39);
        }
      }

      // Assinaturas (última página)
      const totalPages = doc.getNumberOfPages();
      doc.setPage(totalPages);
      const signatureY = pageHeight - 50;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Assinaturas:', 14, signatureY);

      doc.setFont('helvetica', 'normal');
      doc.line(14, signatureY + 20, 90, signatureY + 20);
      doc.text('Responsável pela Qualidade', 14, signatureY + 25);

      doc.line(pageWidth - 90, signatureY + 20, pageWidth - 14, signatureY + 20);
      doc.text('Gerente Geral', pageWidth - 90, signatureY + 25);

      // Rodapé em todas as páginas
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        
        const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        const footerText = `Gerado em: ${dataGeracao} | Página ${i} de ${totalPages}`;
        
        const textWidth = doc.getTextWidth(footerText);
        doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
        
        // ID de auditoria
        doc.text(`ID Auditoria: AUD-${Date.now()}`, 14, pageHeight - 10);
      }

      // Salvar PDF
      const nomeArquivo = `${tipoRelatorio}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      doc.save(nomeArquivo);

      toast({
        title: 'Relatório exportado',
        description: 'O arquivo PDF foi gerado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório PDF.',
        variant: 'destructive',
      });
    }
  };

  const getDadosEstatisticas = () => {
    const dados = getDadosPreview();
    
    switch (tipoRelatorio) {
      case 'ncs-periodo':
        return {
          total: dados.length,
          abertas: dados.filter((d: any) => d.status === 'Aberta').length,
          resolvidas: dados.filter((d: any) => d.status === 'Resolvida').length,
          criticas: dados.filter((d: any) => d.severidade === 'Crítica').length,
        };
      case 'documentos-vencidos':
        return {
          total: dados.length,
          vencidos: dados.filter((d: any) => parseInt(d.dias) < 0).length,
          proximos: dados.filter((d: any) => parseInt(d.dias) <= 30 && parseInt(d.dias) >= 0).length,
        };
      default:
        return { total: dados.length };
    }
  };

  const stats = getDadosEstatisticas();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Auditoria</h1>
          <p className="text-muted-foreground">
            Gere relatórios customizados e exporte em PDF
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Relatório */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select
                value={tipoRelatorio}
                onValueChange={(value) => setTipoRelatorio(value as TipoRelatorio)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposRelatorio.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div className="flex items-center gap-2">
                        <tipo.icon className="h-4 w-4" />
                        {tipo.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <Select value={departamento} onValueChange={setDepartamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataInicio && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataFim && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    disabled={(date) => (dataInicio ? date < dataInicio : false)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Categoria */}
            {tipoRelatorio === 'ncs-periodo' && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Filtros Ativos */}
          <div className="flex flex-wrap gap-2">
            {dataInicio && (
              <Badge variant="outline">
                De: {format(dataInicio, 'dd/MM/yyyy')}
              </Badge>
            )}
            {dataFim && (
              <Badge variant="outline">
                Até: {format(dataFim, 'dd/MM/yyyy')}
              </Badge>
            )}
            {departamento !== 'todos' && (
              <Badge variant="outline">
                {departamentos.find((d) => d.value === departamento)?.label}
              </Badge>
            )}
            {categoria !== 'todas' && tipoRelatorio === 'ncs-periodo' && (
              <Badge variant="outline">
                {categorias.find((c) => c.value === categoria)?.label}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        {tipoRelatorio === 'ncs-periodo' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  NCs Abertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.abertas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  NCs Resolvidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.resolvidas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Críticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.criticas}</div>
              </CardContent>
            </Card>
          </>
        )}

        {tipoRelatorio === 'documentos-vencidos' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.vencidos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Próximos 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{stats.proximos}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Preview do Relatório */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preview do Relatório</CardTitle>
          <Button onClick={handleExportarPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {getColunasPreview().map((coluna) => (
                  <TableHead key={coluna}>{coluna}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {getDadosPreview().map((item: any, index) => (
                <TableRow key={index}>
                  {tipoRelatorio === 'trilha-auditoria' && (
                    <>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.acao}</TableCell>
                      <TableCell>{item.usuario}</TableCell>
                      <TableCell>{item.data}</TableCell>
                      <TableCell>{item.documento}</TableCell>
                    </>
                  )}
                  {tipoRelatorio === 'ncs-periodo' && (
                    <>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.titulo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.severidade === 'Crítica'
                              ? 'destructive'
                              : item.severidade === 'Alta'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {item.severidade}
                        </Badge>
                      </TableCell>
                    </>
                  )}
                  {tipoRelatorio === 'documentos-vencidos' && (
                    <>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.titulo}</TableCell>
                      <TableCell>{item.vencimento}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            parseInt(item.dias) < 0
                              ? 'destructive'
                              : parseInt(item.dias) <= 15
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {item.dias} dias
                        </Badge>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Templates Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Templates Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiposRelatorio
              .filter((t) =>
                ['relatorio-mapa', 'exportacao-china', 'auditoria-iso'].includes(t.value)
              )
              .map((template) => (
                <Card
                  key={template.value}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setTipoRelatorio(template.value as TipoRelatorio)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <template.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{template.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Template pré-configurado para {template.label.toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
