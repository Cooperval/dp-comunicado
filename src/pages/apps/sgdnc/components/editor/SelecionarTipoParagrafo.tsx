import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Image, Table, Plus } from "lucide-react";
import { useState } from "react";

interface SelecionarTipoParagrafoProps {
  onSelect: (tipo: 'texto' | 'imagem' | 'tabela') => void;
}

export const SelecionarTipoParagrafo = ({ onSelect }: SelecionarTipoParagrafoProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (tipo: 'texto' | 'imagem' | 'tabela') => {
    onSelect(tipo);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Novo Parágrafo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Selecionar Tipo de Parágrafo</DialogTitle>
          <DialogDescription>
            Escolha o tipo de conteúdo que deseja adicionar ao documento
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <button
            type="button"
            onClick={() => handleSelect('texto')}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-muted hover:border-primary hover:bg-accent transition-colors"
          >
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium">Texto</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelect('imagem')}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-muted hover:border-primary hover:bg-accent transition-colors"
          >
            <Image className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium">Imagem</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelect('tabela')}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-muted hover:border-primary hover:bg-accent transition-colors"
          >
            <Table className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium">Tabela</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
