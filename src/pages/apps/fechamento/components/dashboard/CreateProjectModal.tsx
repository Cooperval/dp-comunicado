import { useState, useEffect } from "react";
import { Project, User, ProjectType } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Briefcase, Building2, ClipboardCheck } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Project | null;
}

export const CreateProjectModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: CreateProjectModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: 'acompanhamento' as ProjectType,
    members: [] as User[],
    boardId: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        projectType: initialData.projectType,
        members: initialData.members,
        boardId: initialData.boardId
      });
    } else {
      setFormData({
        name: '',
        description: '',
        projectType: 'acompanhamento' as ProjectType,
        members: [
          {
            id: 'user-1',
            name: 'João Silva',
            email: 'joao.silva@sugarflow.com',
            role: 'admin'
          }
        ],
        boardId: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const projectData = {
      ...formData,
      boardId: formData.boardId || `board-${Date.now()}`
    };

    onSave(projectData);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      projectType: 'acompanhamento' as ProjectType,
      members: [],
      boardId: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Nome do Projeto *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Safra 2024/2025"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Tipo de Projeto *
            </label>
            <Select
              value={formData.projectType}
              onValueChange={(value: ProjectType) => handleInputChange('projectType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acompanhamento">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Acompanhamento</span>
                  </div>
                </SelectItem>
                <SelectItem value="fechamento">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Fechamento</span>
                  </div>
                </SelectItem>
                <SelectItem value="obra">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Acompanhamento de Obra</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Descrição
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva os objetivos e metas do projeto"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary hover:shadow-glow transition-organic"
              disabled={!formData.name.trim()}
            >
              {initialData ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};