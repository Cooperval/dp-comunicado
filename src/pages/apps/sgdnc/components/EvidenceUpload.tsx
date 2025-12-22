import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface Evidence {
  id: string;
  file: File;
  description: string;
  preview?: string;
}

interface EvidenceUploadProps {
  evidences: Evidence[];
  onChange: (evidences: Evidence[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
};

export function EvidenceUpload({
  evidences,
  onChange,
  maxFiles = 10,
  maxSizeMB = 20,
}: EvidenceUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: maxSizeMB * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`Arquivo muito grande. Limite: ${maxSizeMB}MB`);
        } else {
          toast.error('Tipo de arquivo não suportado');
        }
        return;
      }

      if (evidences.length + acceptedFiles.length > maxFiles) {
        toast.error(`Máximo de ${maxFiles} arquivos`);
        return;
      }

      const newEvidences: Evidence[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        description: '',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));

      onChange([...evidences, ...newEvidences]);
      toast.success(`${acceptedFiles.length} arquivo(s) adicionado(s)`);
    },
  });

  const removeEvidence = (id: string) => {
    const evidence = evidences.find((e) => e.id === id);
    if (evidence?.preview) {
      URL.revokeObjectURL(evidence.preview);
    }
    onChange(evidences.filter((e) => e.id !== id));
  };

  const updateDescription = (id: string, description: string) => {
    onChange(
      evidences.map((e) => (e.id === id ? { ...e, description } : e))
    );
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <div>
          <p className="font-medium">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Fotos, vídeos, PDFs, planilhas (máx. {maxSizeMB}MB por arquivo)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {evidences.length} / {maxFiles} arquivo(s)
          </p>
        </div>
      </div>

      {/* Evidence List */}
      {evidences.length > 0 && (
        <div className="space-y-3">
          {evidences.map((evidence) => (
            <Card key={evidence.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Preview/Icon */}
                  <div className="shrink-0">
                    {evidence.preview ? (
                      <img
                        src={evidence.preview}
                        alt={evidence.file.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                        {getFileIcon(evidence.file.type)}
                      </div>
                    )}
                  </div>

                  {/* File Info & Description */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-medium truncate">{evidence.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(evidence.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`desc-${evidence.id}`} className="text-xs">
                        Descrição (opcional)
                      </Label>
                      <Input
                        id={`desc-${evidence.id}`}
                        placeholder="Ex: Foto do produto com defeito..."
                        value={evidence.description}
                        onChange={(e) =>
                          updateDescription(evidence.id, e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEvidence(evidence.id)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
