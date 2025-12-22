import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, FileText, Edit3 } from 'lucide-react';

interface SavedScenarioOption {
  id: string;
  name: string;
}

interface ScenarioSelectorProps {
  selectedScenario: string;
  onScenarioChange: (value: string) => void;
  savedScenarios: SavedScenarioOption[];
  showCurrentOption?: boolean;
}

export function ScenarioSelector({
  selectedScenario,
  onScenarioChange,
  savedScenarios,
  showCurrentOption = true
}: ScenarioSelectorProps) {
  return (
    <Select value={selectedScenario} onValueChange={onScenarioChange}>
      <SelectTrigger className="w-[280px] bg-background">
        <SelectValue placeholder="Selecione o cenário" />
      </SelectTrigger>
      <SelectContent className="bg-background z-50">
        {showCurrentOption && (
          <SelectItem value="current">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              <span>Cenário Atual</span>
            </div>
          </SelectItem>
        )}
        <SelectItem value="consolidated">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <span>Visão Consolidada</span>
          </div>
        </SelectItem>
        {savedScenarios.map(scenario => (
          <SelectItem key={scenario.id} value={scenario.id}>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{scenario.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
