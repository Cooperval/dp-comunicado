import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const tiposOcorrencia = [
  "Mudança de Escala",
  "Compensação",
  "Dispensa",
  "Entrada/Saída",
  "Falta Justificada",
  "Prêmio",
  "Banco de Horas"
];

const motivosPredefinidos = {
  "Mudança de Escala": [
    "Cobertura de ausência",
    "Demanda operacional",
    "Solicitação do gestor"
  ],
  "Compensação": [
    "Horas extras trabalhadas",
    "Trabalho em feriado",
    "Plantão extraordinário"
  ],
  "Dispensa": [
    "Aniversário",
    "Doação de sangue",
    "Casamento"
  ],
  "Entrada/Saída": [
    "Consulta médica",
    "Compromisso pessoal",
    "Emergência familiar"
  ],
  "Falta Justificada": [
    "Atestado médico",
    "Luto",
    "Licença paternidade/maternidade"
  ],
  "Prêmio": [
    "Assiduidade",
    "Pontualidade",
    "Desempenho excepcional"
  ],
  "Banco de Horas": [
    "Acúmulo de horas",
    "Utilização de horas",
    "Compensação de saldo"
  ]
};

export default function NovaOcorrencia() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    colaborador: "",
    codigo: "",
    tipo: "",
    data: undefined as Date | undefined,
    horario: "",
    motivo: "",
    observacoes: ""
  });

  const motivosDisponiveis = formData.tipo ? motivosPredefinidos[formData.tipo as keyof typeof motivosPredefinidos] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Simula uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Simula sucesso (90% das vezes)
      if (Math.random() > 0.1) {
        toast({
          title: "✓ Ocorrência registrada",
          description: "A ocorrência foi salva com sucesso e o RH foi notificado.",
          className: "border-primary bg-primary/5 animate-in slide-in-from-top-5 duration-300",
        });
        
        setTimeout(() => navigate("/"), 1500);
      } else {
        throw new Error("Falha na comunicação");
      }
    } catch (error) {
      toast({
        title: "✗ Erro ao registrar",
        description: "Não foi possível salvar a ocorrência. Tente novamente.",
        variant: "destructive",
        className: "animate-in slide-in-from-top-5 duration-300",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Ocorrência</h1>
          <p className="text-muted-foreground mt-1">
            Registre uma nova ocorrência do ponto eletrônico
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Colaborador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colaborador">Nome do Colaborador *</Label>
              <Input
                id="colaborador"
                placeholder="Digite o nome completo"
                value={formData.colaborador}
                onChange={(e) => setFormData(prev => ({ ...prev, colaborador: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código do Colaborador *</Label>
              <Input
                id="codigo"
                placeholder="Ex: 001234"
                value={formData.codigo}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Tipo de Ocorrência */}
          <div className="space-y-2">
            <Label>Tipo de Ocorrência *</Label>
            <Select value={formData.tipo} onValueChange={(value) => {
              setFormData(prev => ({ ...prev, tipo: value, motivo: "" }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de ocorrência" />
              </SelectTrigger>
              <SelectContent>
                {tiposOcorrencia.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Ocorrência *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data ? format(formData.data, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data}
                    onSelect={(date) => setFormData(prev => ({ ...prev, data: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario">Horário *</Label>
              <Input
                id="horario"
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData(prev => ({ ...prev, horario: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo da Ocorrência *</Label>
            <Select 
              value={formData.motivo} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, motivo: value }))}
              disabled={!formData.tipo}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  formData.tipo 
                    ? "Selecione o motivo" 
                    : "Primeiro selecione o tipo de ocorrência"
                } />
              </SelectTrigger>
              <SelectContent>
                {motivosDisponiveis.map((motivo) => (
                  <SelectItem key={motivo} value={motivo}>
                    {motivo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              placeholder="Digite observações relevantes (opcional)"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              <Save className="w-4 h-4 mr-2" />
              Registrar Ocorrência
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}