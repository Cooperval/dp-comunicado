import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { TabelaConteudo } from "@/types/paragrafo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TabelaParagrafoProps {
  conteudo: TabelaConteudo;
  onChange: (conteudo: TabelaConteudo) => void;
}

export const TabelaParagrafo = ({ conteudo, onChange }: TabelaParagrafoProps) => {
  const adicionarColuna = () => {
    const novasColunas = [...conteudo.colunas, `Coluna ${conteudo.colunas.length + 1}`];
    const novasLinhas = conteudo.linhas.map((linha) => [...linha, ""]);
    onChange({ colunas: novasColunas, linhas: novasLinhas });
  };

  const removerColuna = (index: number) => {
    if (conteudo.colunas.length <= 1) return;
    const novasColunas = conteudo.colunas.filter((_, i) => i !== index);
    const novasLinhas = conteudo.linhas.map((linha) => linha.filter((_, i) => i !== index));
    onChange({ colunas: novasColunas, linhas: novasLinhas });
  };

  const adicionarLinha = () => {
    const novaLinha = Array(conteudo.colunas.length).fill("");
    onChange({ ...conteudo, linhas: [...conteudo.linhas, novaLinha] });
  };

  const removerLinha = (index: number) => {
    const novasLinhas = conteudo.linhas.filter((_, i) => i !== index);
    onChange({ ...conteudo, linhas: novasLinhas });
  };

  const atualizarColuna = (index: number, valor: string) => {
    const novasColunas = [...conteudo.colunas];
    novasColunas[index] = valor;
    onChange({ ...conteudo, colunas: novasColunas });
  };

  const atualizarCelula = (linhaIndex: number, colunaIndex: number, valor: string) => {
    const novasLinhas = [...conteudo.linhas];
    novasLinhas[linhaIndex][colunaIndex] = valor;
    onChange({ ...conteudo, linhas: novasLinhas });
  };

  const inicializarTabela = () => {
    onChange({
      colunas: ["Coluna 1", "Coluna 2"],
      linhas: [
        ["", ""],
        ["", ""],
      ],
    });
  };

  if (conteudo.colunas.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground mb-4">Nenhuma tabela criada</p>
        <Button type="button" onClick={inicializarTabela}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Tabela
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={adicionarColuna}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Coluna
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={adicionarLinha}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Linha
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {conteudo.colunas.map((coluna, index) => (
                <TableHead key={index} className="p-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={coluna}
                      onChange={(e) => atualizarColuna(index, e.target.value)}
                      className="h-8 text-sm font-medium"
                      placeholder="Nome da coluna"
                    />
                    {conteudo.colunas.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => removerColuna(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {conteudo.linhas.map((linha, linhaIndex) => (
              <TableRow key={linhaIndex}>
                {linha.map((celula, colunaIndex) => (
                  <TableCell key={colunaIndex} className="p-2">
                    <Input
                      value={celula}
                      onChange={(e) =>
                        atualizarCelula(linhaIndex, colunaIndex, e.target.value)
                      }
                      className="h-8 text-sm"
                      placeholder="Dados"
                    />
                  </TableCell>
                ))}
                <TableCell className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removerLinha(linhaIndex)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
