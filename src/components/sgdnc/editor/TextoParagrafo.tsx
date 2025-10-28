import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextoParagrafoProps {
  conteudo: string;
  onChange: (conteudo: string) => void;
}

export const TextoParagrafo = ({ conteudo, onChange }: TextoParagrafoProps) => {
  return (
    <div className="space-y-2">
      <Label>Conteúdo do Texto</Label>
      <Textarea
        value={conteudo}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite o conteúdo do parágrafo..."
        className="min-h-[120px]"
      />
      <p className="text-xs text-muted-foreground text-right">
        {conteudo.length} caracteres
      </p>
    </div>
  );
};
