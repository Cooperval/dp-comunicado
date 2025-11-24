// src/components/sgdnc/editor/ParagrafoViewer.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Paragrafo {
  id: string;
  type: 'texto' | 'tabela' | 'imagem';
  content: any;
}

export function ParagrafoViewer({ paragrafo }: { paragrafo: Paragrafo }) {
  if (paragrafo.type === 'texto') {
    return (
      <div className="prose prose-sm max-w-none">
        <p>{paragrafo.content}</p>
      </div>
    );
  }

  if (paragrafo.type === 'tabela') {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {paragrafo.content.colunas.map((col: string, i: number) => (
                  <TableHead key={i}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paragrafo.content.linhas.map((row: string[], i: number) => (
                <TableRow key={i}>
                  {row.map((cell: string, j: number) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (paragrafo.type === 'imagem') {
    return (
      <div className="flex justify-center my-4">
        <img
          src={paragrafo.content.url}
          alt="Imagem do documento"
          className="max-w-full h-auto rounded-lg border"
        />
      </div>
    );
  }

  return null;
}