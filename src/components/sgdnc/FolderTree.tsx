
import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Pasta {
  id: string;
  nome: string;
  pasta_parent_id?: string | null;
  pastaParentId?: string;
  cor?: string;
}

interface FolderTreeProps {
  pastas: Pasta[];
  pastaAtual: number | null;
  onSelectPasta: (pastaId: number | null) => void;
  onEditPasta?: (pasta: Pasta) => void;
  onDeletePasta?: (pasta: Pasta) => void;
}

export function FolderTree({ pastas, pastaAtual, onSelectPasta, onEditPasta, onDeletePasta }: FolderTreeProps) {
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
    const subPastas = pastas.filter(p => p.PASTA_PARENT_ID === pasta.ID_PASTA);
    const hasChildren = subPastas.length > 0;
    const isExpanded = pastasExpandidas.has(pasta.ID_PASTA);
    const isSelected = pastaAtual === pasta.ID_PASTA;

    return (
      <div key={pasta.id}>
        <div className="flex items-center group">
          <Button
            variant="ghost"
            className={cn(
              'flex-1 justify-start gap-1 h-9 px-2',
              isSelected && 'bg-accent text-accent-foreground'
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => onSelectPasta(pasta.ID_PASTA)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePasta(pasta.ID_PASTA);
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
              <FolderOpen className="h-4 w-4" style={{ color: pasta.COR }} />
            ) : (
              <Folder className="h-4 w-4" style={{ color: pasta.COR }} />
            )}
            <span className="text-sm truncate">{pasta.NOME}</span>
          </Button>
          
          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditPasta?.(pasta)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeletePasta?.(pasta)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {subPastas.map(subPasta => renderPasta(subPasta, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const pastasRaiz = pastas.filter(p => !p.PASTA_PARENT_ID);

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