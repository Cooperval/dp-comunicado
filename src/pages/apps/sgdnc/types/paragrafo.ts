export interface ImagemConteudo {
  url: string;
  legenda?: string;
  arquivo?: File;
}

export interface TabelaConteudo {
  colunas: string[];
  linhas: string[][];
}

export interface Paragrafo {
  id: string;
  ordem: number;
  tipo: 'texto' | 'imagem' | 'tabela';
  conteudo: string | ImagemConteudo | TabelaConteudo;
}
