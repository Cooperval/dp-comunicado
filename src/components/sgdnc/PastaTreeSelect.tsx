import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Pasta } from '@/services/sgdncMockData';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PastaTreeSelectProps {
  pastas: Pasta[];
  value: string;
  onChange: (pastaId: string) => void;
  placeholder?: string;
}

export function PastaTreeSelect({ pastas, value, onChange, placeholder = 'Selecione uma pasta' }: PastaTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [pastasExpandidas, setPastasExpandidas] = useState<Set<string>>(new Set());

  const togglePasta = (pastaId: string) => {
    const novasPastas = new Set(pastasExpandidas);
    if (novasPastas.has(pastaId)) {
      novasPastas.delete(pastaId);
    } else {
      novasPastas.add(pastaId);
    }
    setPastasExpandidas(novasPastas);
  };

  const getPastaPath = (pastaId: string): string => {
    if (!pastaId) return 'Raiz';
    const pasta = pastas.find(p => p.id === pastaId);
    if (!pasta) return '';
    
    if (pasta.pastaParentId) {
      return `${getPastaPath(pasta.pastaParentId)} / ${pasta.nome}`;
    }
    return pasta.nome;
  };

  const renderPasta = (pasta: Pasta, level: number = 0) => {
    const subPastas = pastas.filter(p => p.pastaParentId === pasta.id);
    const hasChildren = subPastas.length > 0;
    const isExpanded = pastasExpandidas.has(pasta.id);
    const isSelected = value === pasta.id;

    return (
      <div key={pasta.id}>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-1 h-9 px-2',
            isSelected && 'bg-accent text-accent-foreground'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            onChange(pasta.id);
            setOpen(false);
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePasta(pasta.id);
              }}
              className="p-0 h-4 w-4 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          {isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4" style={{ color: pasta.cor }} />
          ) : (
            <Folder className="h-4 w-4" style={{ color: pasta.cor }} />
          )}
          <span className="text-sm truncate">{pasta.nome}</span>
        </Button>
        {hasChildren && isExpanded && (
          <div>
            {subPastas.map(subPasta => renderPasta(subPasta, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const pastasRaiz = pastas.filter(p => !p.pastaParentId);
  const pastaAtual = pastas.find(p => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4" style={{ color: pastaAtual?.cor }} />
            <span className="truncate">
              {value ? getPastaPath(value) : placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start h-9 px-2 mb-1',
                value === '' && 'bg-accent text-accent-foreground'
              )}
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              <Folder className="h-4 w-4 mr-2" />
              <span className="text-sm">Raiz</span>
            </Button>
            {pastasRaiz.map(pasta => renderPasta(pasta))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
