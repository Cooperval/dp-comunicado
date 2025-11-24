import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NumericInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  label,
  value,
  onChange,
  unit,
  placeholder,
  className,
  disabled = false,
  min,
  max,
  step = 0.01,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {unit && <span className="text-muted-foreground ml-1">({unit})</span>}
      </Label>
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className="transition-smooth focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
};