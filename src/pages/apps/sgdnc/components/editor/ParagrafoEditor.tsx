import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Trash2, FileText, Image, Table } from "lucide-react";
import { Paragrafo, ImagemConteudo, TabelaConteudo } from "@/types/paragrafo";
import { TextoParagrafo } from "./TextoParagrafo";
import { ImagemParagrafo } from "./ImagemParagrafo";
import { TabelaParagrafo } from "./TabelaParagrafo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ParagrafoEditorProps {
  paragrafo: Paragrafo;
  onUpdate: (conteudo: Paragrafo['conteudo']) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const ParagrafoEditor = ({
  paragrafo,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: ParagrafoEditorProps) => {
  const getTipoInfo = () => {
    switch (paragrafo.tipo) {
      case 'texto':
        return { icon: FileText, label: 'Texto', variant: 'default' as const };
      case 'imagem':
        return { icon: Image, label: 'Imagem', variant: 'secondary' as const };
      case 'tabela':
        return { icon: Table, label: 'Tabela', variant: 'outline' as const };
    }
  };

  const { icon: Icon, label, variant } = getTipoInfo();

  const temConteudo = () => {
    if (paragrafo.tipo === 'texto') {
      return (paragrafo.conteudo as string).length > 0;
    }
    if (paragrafo.tipo === 'imagem') {
      return !!(paragrafo.conteudo as ImagemConteudo).url;
    }
    if (paragrafo.tipo === 'tabela') {
      return (paragrafo.conteudo as TabelaConteudo).colunas.length > 0;
    }
    return false;
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={variant} className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Parágrafo {paragrafo.ordem}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              className="h-8 w-8"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              className="h-8 w-8"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover parágrafo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {temConteudo()
                      ? "Este parágrafo contém conteúdo. Tem certeza que deseja removê-lo? Esta ação não pode ser desfeita."
                      : "Tem certeza que deseja remover este parágrafo?"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paragrafo.tipo === 'texto' && (
          <TextoParagrafo
            conteudo={paragrafo.conteudo as string}
            onChange={onUpdate}
          />
        )}
        {paragrafo.tipo === 'imagem' && (
          <ImagemParagrafo
            conteudo={paragrafo.conteudo as ImagemConteudo}
            onChange={onUpdate}
          />
        )}
        {paragrafo.tipo === 'tabela' && (
          <TabelaParagrafo
            conteudo={paragrafo.conteudo as TabelaConteudo}
            onChange={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
};
