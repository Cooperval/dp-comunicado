import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Quote,
  Heading2,
} from 'lucide-react';

interface MarkdownEditorProps {
  conteudo: string;
  onChange: (conteudo: string) => void;
}

export const MarkdownEditor = ({ conteudo, onChange }: MarkdownEditorProps) => {
  const [activeTab, setActiveTab] = useState<'editar' | 'visualizar'>('editar');

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea[data-markdown-editor]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = conteudo.substring(start, end);
    const newText = 
      conteudo.substring(0, start) + 
      before + selectedText + after + 
      conteudo.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, label: 'Negrito', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: 'Itálico', action: () => insertMarkdown('_', '_') },
    { icon: Heading2, label: 'Título', action: () => insertMarkdown('## ', '') },
    { icon: List, label: 'Lista', action: () => insertMarkdown('- ', '') },
    { icon: ListOrdered, label: 'Lista Numerada', action: () => insertMarkdown('1. ', '') },
    { icon: LinkIcon, label: 'Link', action: () => insertMarkdown('[texto](', ')') },
    { icon: Code, label: 'Código', action: () => insertMarkdown('`', '`') },
    { icon: Quote, label: 'Citação', action: () => insertMarkdown('> ', '') },
  ];

  return (
    <div className="space-y-2">
      <Label>Conteúdo do Texto (Markdown)</Label>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="editar">Editar</TabsTrigger>
            <TabsTrigger value="visualizar">Visualizar</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editar" className="space-y-2">
          <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50">
            {formatButtons.map((btn, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                onClick={btn.action}
                title={btn.label}
                className="h-8 w-8 p-0"
              >
                <btn.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          <Textarea
            data-markdown-editor
            value={conteudo}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite o conteúdo usando Markdown...

**Negrito** ou __negrito__
*Itálico* ou _itálico_
# Título 1
## Título 2
- Lista
1. Lista numerada
[Link](https://example.com)
`código inline`
> Citação"
            className="min-h-[200px] font-mono text-sm"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{conteudo.length} caracteres</span>
            <a
              href="https://www.markdownguide.org/basic-syntax/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Guia de Markdown
            </a>
          </div>
        </TabsContent>

        <TabsContent value="visualizar">
          <div className="min-h-[200px] p-4 border rounded-md bg-background prose prose-sm max-w-none dark:prose-invert">
            {conteudo.trim() === '' ? (
              <p className="text-muted-foreground italic">
                Nenhum conteúdo para visualizar
              </p>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {conteudo}
              </ReactMarkdown>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
