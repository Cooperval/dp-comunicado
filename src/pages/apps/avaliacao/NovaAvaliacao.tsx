import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { mockAPI } from '@/services/mockData';

export default function NovaAvaliacao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gestorId: '',
    aprendizId: '',
    prazo: '',
    observacoes: '',
  });

  // Mock de gestores e aprendizes
  const gestores = [
    { id: '1', nome: 'Carlos Silva' },
    { id: '2', nome: 'Ana Costa' },
    { id: '3', nome: 'Pedro Santos' },
  ];

  const aprendizes = [
    { id: '1', nome: 'João Oliveira' },
    { id: '2', nome: 'Maria Souza' },
    { id: '3', nome: 'Lucas Ferreira' },
    { id: '4', nome: 'Beatriz Lima' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.gestorId || !formData.aprendizId || !formData.prazo) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await mockAPI.createAvaliacao({
        ...formData,
        criadoPor: user?.id,
      });

      toast({
        title: 'Sucesso',
        description: 'Avaliação cadastrada com sucesso',
      });

      navigate('/apps/avaliacao/lista');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar avaliação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Avaliação</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre uma nova avaliação para um gestor realizar
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gestor">
                  Gestor Responsável <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gestorId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gestorId: value })
                  }
                >
                  <SelectTrigger id="gestor">
                    <SelectValue placeholder="Selecione o gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    {gestores.map((gestor) => (
                      <SelectItem key={gestor.id} value={gestor.id}>
                        {gestor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aprendiz">
                  Jovem Aprendiz <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.aprendizId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, aprendizId: value })
                  }
                >
                  <SelectTrigger id="aprendiz">
                    <SelectValue placeholder="Selecione o aprendiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {aprendizes.map((aprendiz) => (
                      <SelectItem key={aprendiz.id} value={aprendiz.id}>
                        {aprendiz.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">
                Prazo para Conclusão <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prazo"
                type="date"
                value={formData.prazo}
                onChange={(e) =>
                  setFormData({ ...formData, prazo: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione observações sobre a avaliação (opcional)"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Cadastrar Avaliação'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
