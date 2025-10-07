import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const mockOcorrencias = [
  {
    id: "001",
    colaborador: "Maria Silva",
    codigo: "001234",
    setor: "Recursos Humanos",
    tipo: "Entrada/Saída",
    data: "2024-01-15",
    horario: "14:30",
    motivo: "Consulta médica",
    status: "pending" as const,
    prazoVencimento: "2024-01-17",
    registradoPor: "João Santos"
  },
  {
    id: "002",
    colaborador: "João Santos",
    codigo: "001235", 
    setor: "Tecnologia",
    tipo: "Falta Justificada",
    data: "2024-01-15",
    horario: "08:00",
    motivo: "Atestado médico",
    status: "approved" as const,
    prazoVencimento: "2024-01-17",
    registradoPor: "Ana Costa"
  },
  {
    id: "003",
    colaborador: "Ana Costa",
    codigo: "001236",
    setor: "Financeiro", 
    tipo: "Banco de Horas",
    data: "2024-01-14",
    horario: "18:00",
    motivo: "Compensação pendente há 48h",
    status: "urgent" as const,
    prazoVencimento: "2024-01-16",
    registradoPor: "Maria Silva"
  },
  {
    id: "004",
    colaborador: "Pedro Oliveira",
    codigo: "001237",
    setor: "Vendas",
    tipo: "Compensação",
    data: "2024-01-13",
    horario: "16:00", 
    motivo: "Horas extras trabalhadas",
    status: "rejected" as const,
    prazoVencimento: "2024-01-15",
    registradoPor: "João Santos"
  }
];

export default function Ocorrencias() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");

  const filteredOcorrencias = mockOcorrencias.filter(ocorrencia => {
    const matchesSearch = ocorrencia.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ocorrencia.codigo.includes(searchTerm) ||
                         ocorrencia.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ocorrencia.status === statusFilter;
    const matchesTipo = tipoFilter === "all" || ocorrencia.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pendente", variant: "pending" as const };
      case "approved":
        return { label: "Aprovada", variant: "approved" as const };
      case "rejected":
        return { label: "Rejeitada", variant: "rejected" as const };
      case "urgent":
        return { label: "Urgente", variant: "urgent" as const };
      default:
        return { label: "Rascunho", variant: "draft" as const };
    }
  };

  const handleAction = (action: string, id: string) => {
    console.log(`Ação ${action} executada para ocorrência ${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ocorrências</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as ocorrências do ponto eletrônico
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:bg-primary-hover"
          onClick={() => navigate("/apps/controle-ponto/ocorrencia")}
        >
          <FileText className="w-4 h-4 mr-2" />
          Nova Ocorrência
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por colaborador, código ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovada</SelectItem>
              <SelectItem value="rejected">Rejeitada</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="Entrada/Saída">Entrada/Saída</SelectItem>
              <SelectItem value="Falta Justificada">Falta Justificada</SelectItem>
              <SelectItem value="Banco de Horas">Banco de Horas</SelectItem>
              <SelectItem value="Compensação">Compensação</SelectItem>
              <SelectItem value="Mudança de Escala">Mudança de Escala</SelectItem>
              <SelectItem value="Dispensa">Dispensa</SelectItem>
              <SelectItem value="Prêmio">Prêmio</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredOcorrencias.length} de {mockOcorrencias.length} ocorrências
        </p>
        <div className="flex gap-2">
          <Badge variant="outline">{filteredOcorrencias.filter(o => o.status === "pending").length} Pendentes</Badge>
          <Badge variant="outline">{filteredOcorrencias.filter(o => o.status === "urgent").length} Urgentes</Badge>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOcorrencias.map((ocorrencia) => {
              const statusInfo = getStatusInfo(ocorrencia.status);
              const isOverdue = new Date(ocorrencia.prazoVencimento) < new Date();
              
              return (
                <TableRow key={ocorrencia.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {ocorrencia.colaborador}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ocorrencia.codigo} • {ocorrencia.setor}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ocorrencia.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{ocorrencia.data}</p>
                      <p className="text-muted-foreground">{ocorrencia.horario}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-xs truncate">
                      {ocorrencia.motivo}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className={cn(
                        "font-medium",
                        isOverdue ? "text-destructive" : "text-foreground"
                      )}>
                        {ocorrencia.prazoVencimento}
                      </p>
                      {isOverdue && (
                        <p className="text-xs text-destructive">Vencido</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {ocorrencia.status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleAction("approve", ocorrencia.id)}
                          >
                            <CheckCircle className="w-4 h-4 text-accent" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleAction("reject", ocorrencia.id)}
                          >
                            <XCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}