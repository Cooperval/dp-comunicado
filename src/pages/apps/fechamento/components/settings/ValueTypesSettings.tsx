import { useState } from "react";
import { ValueTypeConfig } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Scale, 
  MapPin, 
  Percent,
  Settings
} from "lucide-react";

const defaultValueTypes: ValueTypeConfig[] = [
  {
    id: 'currency',
    name: 'Monetário',
    abbreviation: 'R$',
    icon: 'DollarSign',
    active: true
  },
  {
    id: 'tons',
    name: 'Toneladas',
    abbreviation: 't',
    icon: 'Scale',
    active: true
  },
  {
    id: 'hectares',
    name: 'Hectares',
    abbreviation: 'ha',
    icon: 'MapPin',
    active: true
  },
  {
    id: 'percentage',
    name: 'Percentual',
    abbreviation: '%',
    icon: 'Percent',
    active: true
  }
];

const iconMap = {
  DollarSign: <DollarSign className="w-4 h-4" />,
  Scale: <Scale className="w-4 h-4" />,
  MapPin: <MapPin className="w-4 h-4" />,
  Percent: <Percent className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />
};

export const ValueTypesSettings = () => {
  const [valueTypes, setValueTypes] = useState<ValueTypeConfig[]>(defaultValueTypes);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ValueTypeConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    icon: 'Settings'
  });

  const handleCreateOrUpdate = () => {
    if (!formData.name.trim() || !formData.abbreviation.trim()) return;

    if (editingType) {
      // Update existing
      setValueTypes(prev => prev.map(type =>
        type.id === editingType.id
          ? { ...type, name: formData.name, abbreviation: formData.abbreviation, icon: formData.icon }
          : type
      ));
    } else {
      // Create new
      const newType: ValueTypeConfig = {
        id: `custom-${Date.now()}`,
        name: formData.name,
        abbreviation: formData.abbreviation,
        icon: formData.icon,
        active: true
      };
      setValueTypes(prev => [...prev, newType]);
    }

    handleCloseModal();
  };

  const handleEdit = (type: ValueTypeConfig) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      abbreviation: type.abbreviation,
      icon: type.icon
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (typeId: string) => {
    setValueTypes(prev => prev.filter(type => type.id !== typeId));
  };

  const handleToggleActive = (typeId: string) => {
    setValueTypes(prev => prev.map(type =>
      type.id === typeId ? { ...type, active: !type.active } : type
    ));
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingType(null);
    setFormData({
      name: '',
      abbreviation: '',
      icon: 'Settings'
    });
  };

  const canDelete = (type: ValueTypeConfig) => {
    // Don't allow deletion of default types
    return !['currency', 'tons', 'hectares', 'percentage'].includes(type.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tipos de Valor</h2>
          <p className="text-muted-foreground">
            Configure os tipos de valores disponíveis para as tarefas
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar Tipo de Valor' : 'Novo Tipo de Valor'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Nome
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Litros"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Abreviação
                </label>
                <Input
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  placeholder="Ex: L"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Ícone
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(iconMap).map(([iconName, IconComponent]) => (
                    <button
                      key={iconName}
                      type="button"
                      className={`p-3 rounded-lg border-2 transition-organic ${
                        formData.icon === iconName
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData({ ...formData, icon: iconName })}
                    >
                      {IconComponent}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateOrUpdate}>
                  {editingType ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {valueTypes.map((type) => (
          <Card key={type.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {iconMap[type.icon as keyof typeof iconMap] || iconMap.Settings}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Abreviação: <Badge variant="outline" className="text-xs">{type.abbreviation}</Badge>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Ativo</span>
                  <Switch
                    checked={type.active}
                    onCheckedChange={() => handleToggleActive(type.id)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(type)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>

                {canDelete(type) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {valueTypes.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum tipo de valor configurado
          </h3>
          <p className="text-muted-foreground mb-6">
            Crie tipos de valores personalizados para suas tarefas
          </p>
        </div>
      )}
    </div>
  );
};