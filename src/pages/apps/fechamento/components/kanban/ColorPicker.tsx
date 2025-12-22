import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color?: string;
  onColorChange: (color: string) => void;
  label: string;
  presetColors?: string[];
}

const defaultPresetColors = [
  '#ef4444', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
  '#78716c', // stone
];

export const ColorPicker = ({ 
  color = '#3b82f6', 
  onColorChange, 
  label,
  presetColors = defaultPresetColors
}: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);

  const handleColorSelect = (selectedColor: string) => {
    onColorChange(selectedColor);
    setCustomColor(selectedColor);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onColorChange(newColor);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <div 
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: color }}
            />
            <Palette className="w-4 h-4" />
            Escolher cor
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Cores predefinidas</Label>
              <div className="grid grid-cols-5 gap-2">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                      color === presetColor ? 'border-ring' : 'border-border'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => handleColorSelect(presetColor)}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Cor personalizada</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-12 h-8 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    onColorChange(e.target.value);
                  }}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleColorSelect('#ffffff')}
              className="w-full"
            >
              Remover cor
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};