import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Documento } from '@/services/sgdncMockData';
import type { Paragrafo, ImagemConteudo, TabelaConteudo } from '@/types/paragrafo';

export const gerarPDFVersao = async (documento: Documento, versaoNumero: number) => {
  const doc = new jsPDF();
  const versao = documento.versoes.find(v => v.numero === versaoNumero);
  
  if (!versao) {
    throw new Error('Versão não encontrada');
  }

  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text(documento.titulo, 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Versão ${versaoNumero}`, 20, 28);
  doc.text(`Criado por: ${versao.criadoPor}`, 20, 34);
  doc.text(`Data: ${new Date(versao.criadoEm).toLocaleDateString('pt-BR')}`, 20, 40);
  doc.text(`Comentário: ${versao.comentario}`, 20, 46);
  
  // Separator
  doc.setDrawColor(233, 236, 239);
  doc.line(20, 50, 190, 50);
  
  let yPosition = 60;

  // Descrição
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text('Descrição:', 20, yPosition);
  yPosition += 6;
  
  doc.setFontSize(10);
  doc.setTextColor(73, 80, 87);
  const descricaoLines = doc.splitTextToSize(documento.descricao, 170);
  doc.text(descricaoLines, 20, yPosition);
  yPosition += descricaoLines.length * 6 + 10;

  // Metadados
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text('Metadados:', 20, yPosition);
  yPosition += 10;

  const metadados = [
    ['Tipo', documento.tipo],
    ['Nível de Conformidade', documento.nivelConformidade],
    ['Pasta', documento.pastaId],
    ['Tags', documento.tags.join(', ')],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Campo', 'Valor']],
    body: metadados,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 20, right: 20 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Parágrafos (do snapshot ou atuais)
  const paragrafos = versao.snapshot?.paragrafos || documento.paragrafos || [];
  
  if (paragrafos.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.text('Conteúdo do Documento:', 20, yPosition);
    yPosition += 10;

    paragrafos.forEach((paragrafo, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(73, 80, 87);
      
      if (paragrafo.tipo === 'texto') {
        const texto = paragrafo.conteudo as string;
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. Parágrafo de Texto:`, 20, yPosition);
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
        const textoLines = doc.splitTextToSize(texto, 170);
        doc.text(textoLines, 20, yPosition);
        yPosition += textoLines.length * 6 + 8;
      } else if (paragrafo.tipo === 'imagem') {
        const imagem = paragrafo.conteudo as ImagemConteudo;
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. Imagem:`, 20, yPosition);
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Legenda: ${imagem.legenda || 'Sem legenda'}`, 20, yPosition);
        doc.text(`URL: ${imagem.url}`, 20, yPosition + 6);
        yPosition += 18;
      } else if (paragrafo.tipo === 'tabela') {
        const tabela = paragrafo.conteudo as TabelaConteudo;
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. Tabela:`, 20, yPosition);
        yPosition += 10;
        
        autoTable(doc, {
          startY: yPosition,
          head: [tabela.colunas],
          body: tabela.linhas,
          theme: 'grid',
          margin: { left: 20, right: 20 },
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
    });
  }

  // Rodapé
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(173, 181, 189);
    doc.text(
      `Página ${i} de ${totalPages}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Salvar PDF
  const fileName = `${documento.titulo.replace(/\s+/g, '_')}_v${versaoNumero}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
