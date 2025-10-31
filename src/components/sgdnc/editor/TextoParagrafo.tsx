import { MarkdownEditor } from './MarkdownEditor';

interface TextoParagrafoProps {
  conteudo: string;
  onChange: (conteudo: string) => void;
}

export const TextoParagrafo = ({ conteudo, onChange }: TextoParagrafoProps) => {
  return <MarkdownEditor conteudo={conteudo} onChange={onChange} />;
};
