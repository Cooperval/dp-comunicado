import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Paragrafo, ImagemConteudo, TabelaConteudo } from '@/types/paragrafo';

interface CompararVersoesProps {
  versaoAntiga: {
    numero: number;
    paragrafos: Paragrafo[];
  };
  versaoNova: {
    numero: number;
    paragrafos: Paragrafo[];
  };
}

type DiferencaTipo = 'adicionado' | 'removido' | 'modificado' | 'igual';

interface ParagrafoDiff {
  paragrafo: Paragrafo | null;
  tipo: DiferencaTipo;
  index: number;
}

export function CompararVersoes({ versaoAntiga, versaoNova }: CompararVersoesProps) {
  // Calcular diferenças
  const calcularDiferencas = (): { antiga: ParagrafoDiff[], nova: ParagrafoDiff[] } => {
    const antiga: ParagrafoDiff[] = [];
    const nova: ParagrafoDiff[] = [];
    
    const maxLength = Math.max(versaoAntiga.paragrafos.length, versaoNova.paragrafos.length);
    
    for (let i = 0; i < maxLength; i++) {
      const pAntigo = versaoAntiga.paragrafos[i];
      const pNovo = versaoNova.paragrafos[i];
      
      if (pAntigo && !pNovo) {
        antiga.push({ paragrafo: pAntigo, tipo: 'removido', index: i });
        nova.push({ paragrafo: null, tipo: 'removido', index: i });
      } else if (!pAntigo && pNovo) {
        antiga.push({ paragrafo: null, tipo: 'adicionado', index: i });
        nova.push({ paragrafo: pNovo, tipo: 'adicionado', index: i });
      } else if (pAntigo && pNovo) {
        const conteudoAntigo = JSON.stringify(pAntigo.conteudo);
        const conteudoNovo = JSON.stringify(pNovo.conteudo);
        
        if (conteudoAntigo !== conteudoNovo || pAntigo.tipo !== pNovo.tipo) {
          antiga.push({ paragrafo: pAntigo, tipo: 'modificado', index: i });
          nova.push({ paragrafo: pNovo, tipo: 'modificado', index: i });
        } else {
          antiga.push({ paragrafo: pAntigo, tipo: 'igual', index: i });
          nova.push({ paragrafo: pNovo, tipo: 'igual', index: i });
        }
      }
    }
    
    return { antiga, nova };
  };

  const { antiga, nova } = calcularDiferencas();

  const renderParagrafo = (paragrafo: Paragrafo | null, tipo: DiferencaTipo) => {
    if (!paragrafo) {
      return (
        <div className="text-muted-foreground text-sm italic">
          {tipo === 'removido' ? 'Parágrafo removido' : 'Parágrafo não existia'}
        </div>
      );
    }

    const getBgClass = () => {
      if (tipo === 'adicionado') return 'bg-green-50 dark:bg-green-950/20';
      if (tipo === 'removido') return 'bg-red-50 dark:bg-red-950/20';
      if (tipo === 'modificado') return 'bg-yellow-50 dark:bg-yellow-950/20';
      return 'bg-background';
    };

    const getBorderClass = () => {
      if (tipo === 'adicionado') return 'border-green-300 dark:border-green-700';
      if (tipo === 'removido') return 'border-red-300 dark:border-red-700';
      if (tipo === 'modificado') return 'border-yellow-300 dark:border-yellow-700';
      return 'border-border';
    };

    if (paragrafo.tipo === 'texto') {
      return (
        <div className={`p-3 rounded border ${getBgClass()} ${getBorderClass()}`}>
          <p className="whitespace-pre-wrap text-sm">{paragrafo.conteudo as string}</p>
        </div>
      );
    }

    if (paragrafo.tipo === 'imagem') {
      const imagem = paragrafo.conteudo as ImagemConteudo;
      return (
        <div className={`p-3 rounded border ${getBgClass()} ${getBorderClass()}`}>
          <img 
            src={imagem.url} 
            alt={imagem.legenda || 'Imagem'} 
            className="max-w-full h-auto max-h-40 rounded mb-2"
          />
          {imagem.legenda && (
            <p className="text-xs text-muted-foreground italic">{imagem.legenda}</p>
          )}
        </div>
      );
    }

    if (paragrafo.tipo === 'tabela') {
      const tabela = paragrafo.conteudo as TabelaConteudo;
      return (
        <div className={`p-3 rounded border ${getBgClass()} ${getBorderClass()}`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {tabela.colunas.map((col, idx) => (
                    <th key={idx} className="border border-border p-1 bg-muted">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabela.linhas.slice(0, 3).map((linha, idxL) => (
                  <tr key={idxL}>
                    {linha.map((cel, idxC) => (
                      <td key={idxC} className="border border-border p-1">
                        {cel}
                      </td>
                    ))}
                  </tr>
                ))}
                {tabela.linhas.length > 3 && (
                  <tr>
                    <td colSpan={tabela.colunas.length} className="text-center text-muted-foreground p-1">
                      ... e mais {tabela.linhas.length - 3} linha(s)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  const getLabel = (tipo: DiferencaTipo) => {
    switch (tipo) {
      case 'adicionado': return <Badge className="bg-green-500">Adicionado</Badge>;
      case 'removido': return <Badge className="bg-red-500">Removido</Badge>;
      case 'modificado': return <Badge className="bg-yellow-500">Modificado</Badge>;
      default: return <Badge variant="outline">Sem alteração</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const labels: Record<string, string> = {
      texto: 'Texto',
      imagem: 'Imagem',
      tabela: 'Tabela'
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Versão Antiga */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center justify-between">
            <span>Versão {versaoAntiga.numero}</span>
            <Badge variant="secondary">Antiga</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-4">
              {antiga.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                    {item.paragrafo && (
                      <Badge variant="secondary" className="text-xs">
                        {getTipoBadge(item.paragrafo.tipo)}
                      </Badge>
                    )}
                    {getLabel(item.tipo)}
                  </div>
                  {renderParagrafo(item.paragrafo, item.tipo)}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Versão Nova */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center justify-between">
            <span>Versão {versaoNova.numero}</span>
            <Badge>Nova</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-4">
              {nova.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                    {item.paragrafo && (
                      <Badge variant="secondary" className="text-xs">
                        {getTipoBadge(item.paragrafo.tipo)}
                      </Badge>
                    )}
                    {getLabel(item.tipo)}
                  </div>
                  {renderParagrafo(item.paragrafo, item.tipo)}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
