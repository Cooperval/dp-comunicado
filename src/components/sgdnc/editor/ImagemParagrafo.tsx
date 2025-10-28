import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, Image } from "lucide-react";
import { ImagemConteudo } from "@/types/paragrafo";
import { useToast } from "@/hooks/use-toast";

interface ImagemParagrafoProps {
  conteudo: ImagemConteudo;
  onChange: (conteudo: ImagemConteudo) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ImagemParagrafo = ({ conteudo, onChange }: ImagemParagrafoProps) => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>(conteudo.url);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "Arquivo muito grande",
            description: "O tamanho máximo permitido é 10MB",
            variant: "destructive",
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result as string;
          setPreviewUrl(url);
          onChange({ ...conteudo, url, arquivo: file });
        };
        reader.readAsDataURL(file);

        toast({
          title: "Imagem carregada",
          description: file.name,
        });
      }
    },
    [conteudo, onChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
  });

  const removerImagem = () => {
    setPreviewUrl("");
    onChange({ url: "", legenda: conteudo.legenda });
  };

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {isDragActive
              ? "Solte a imagem aqui..."
              : "Arraste uma imagem ou clique para selecionar"}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP (máx. 10MB)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-lg border overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto max-h-[400px] object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removerImagem}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="legenda">Legenda (opcional)</Label>
        <Input
          id="legenda"
          value={conteudo.legenda || ""}
          onChange={(e) => onChange({ ...conteudo, legenda: e.target.value })}
          placeholder="Adicione uma legenda para a imagem"
        />
      </div>
    </div>
  );
};
