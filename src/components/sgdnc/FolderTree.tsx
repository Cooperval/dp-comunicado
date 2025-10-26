import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Pasta } from '@/services/sgdncMockData';

interface FolderTreeProps {
  pastas: Pasta[];
  pastaAtual: string;
  onSelectPasta: (pastaId: string) => void;
}

export function FolderTree({ pastas, pastaAtual, onSelectPasta }: FolderTreeProps) {
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

  const renderPasta = (pasta: Pasta, level: number = 0) => {
    const subPastas = pastas.filter(p => p.pastaParentId === pasta.id);
    const hasChildren = subPastas.length > 0;
    const isExpanded = pastasExpandidas.has(pasta.id);
    const isSelected = pastaAtual === pasta.id;

    return (
      <div key={pasta.id}>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-1 h-9 px-2',
            isSelected && 'bg-accent text-accent-foreground'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelectPasta(pasta.id)}
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

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start h-9 px-2',
          pastaAtual === '' && 'bg-accent text-accent-foreground'
        )}
        onClick={() => onSelectPasta('')}
      >
        <Folder className="h-4 w-4 mr-2" />
        <span className="text-sm">Todas as Pastas</span>
      </Button>
      {pastasRaiz.map(pasta => renderPasta(pasta))}
    </div>
  );
}
