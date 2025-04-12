import { Report } from "../models/ReportModel";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel";
import puppeteer from "puppeteer";
import { NextFunction, Request, Response } from "express";

export const reportController = {
  
  async gerarRelatorioCaso(req: Request, res: Response): Promise<void> {
    try {
      const caso = await Case.findById(Case)
      .populate({
        path: "evidencias",
        populate: {
          path: "coletadoPor",
          select: "nome"
        }
      })
      .lean<{ 
        titulo: string;
        descricao: string;
        status: string;
        evidencias: Array<{
          _id: string;
          tipo: string;
          categoria: string;
          imagemURL?: string;
          conteudo?: string;
          coletadoPor?: { nome: string };
        }>;
      }>();
        
      if (!caso) {
        res.status(404).json({ msg: "Caso não encontrado." });
        return;
      }
  
      const evidenciasIds = caso.evidencias.map(e => e._id);
  
      const report = await Report.findOne({ evidencias: { $in: evidenciasIds } }).lean();
  
      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado para este caso." });
        return;
      }
  
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
  
      const evidenciasHtml = caso.evidencias.map(e => `
        <div style="margin-bottom: 20px;">
          <h4>Evidência (${e.tipo}) - ${e.categoria}</h4>
          ${e.tipo === "imagem" ? `<img src="${e.imagemURL}" style="max-width: 300px;" />` : `<p>${e.conteudo}</p>`}
          <p><strong>Coletado por:</strong> ${e.coletadoPor?.nome || "Desconhecido"}</p>
        </div>
      `).join("");
  
      await page.setContent(`
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1, h2, h3, h4 { color: #333; }
              p { margin: 4px 0; }
              .section { margin-bottom: 25px; }
            </style>
          </head>
          <body>
            <h1>Relatório Pericial</h1>
  
            <div class="section">
              <h2>Informações do Caso</h2>
              <p><strong>Título:</strong> ${caso.titulo}</p>
              <p><strong>Descrição:</strong> ${caso.descricao}</p>
              <p><strong>Status:</strong> ${caso.status}</p>
            </div>
  
            <div class="section">
              <h2>Detalhes do Relatório</h2>
              <p><strong>Título:</strong> ${report.titulo}</p>
              <p><strong>Descrição:</strong> ${report.descricao}</p>
              <p><strong>Destinatário:</strong> ${report.destinatario}</p>
              <p><strong>Objeto da Perícia:</strong> ${report.objetoPericia}</p>
              <p><strong>Método Utilizado:</strong> ${report.metodoUtilizado}</p>
              <p><strong>Materiais Utilizados:</strong> ${report.materiaisUtilizados}</p>
              <p><strong>Exames Realizados:</strong> ${report.examesRealizados}</p>
              <p><strong>Considerações Técnico-Periciais:</strong> ${report.consideracoesTecnicoPericiais}</p>
              <p><strong>Conclusão Técnica:</strong> ${report.conclusaoTecnica}</p>
              <p><strong>Assinado Digitalmente:</strong> ${report.assinadoDigitalmente ? "Sim" : "Não"}</p>
              <p><strong>Data de Criação:</strong> ${new Date(report.criadoEm).toLocaleString()}</p>
            </div>
  
            <div class="section">
              <h2>Evidências Relacionadas</h2>
              ${evidenciasHtml}
            </div>
          </body>
        </html>
      `);
  
      const pdf = await page.pdf({ format: "A4" });
      await browser.close();
  
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="relatorio-caso-${Case}.pdf"`);
      res.send(pdf);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Erro ao gerar relatório do caso." });
    }
  },  

  // Rota para assinar digitalmente o relatório
  async assinarDigitalmente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId);

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }

      report.assinadoDigitalmente = true;
      await report.save();

      res.status(200).json({ msg: `Relatório "${report.titulo}" assinado digitalmente.` });
    } catch (err) {
      next(err);
    }
  }
};