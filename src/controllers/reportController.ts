import { Request, Response, NextFunction } from "express";
import { Report } from "../models/ReportModel";
import puppeteer from "puppeteer";
import { Case } from "../models/CaseModel";

export const reportController = {
  // Criar um novo relatório
  async createReport (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { titulo, conteudo, peritoResponsavel, casoRelacionado } = req.body;

      const newReport = await Report.create({
        titulo,
        conteudo,
        peritoResponsavel,
        casoRelacionado,
        dataCriacao: new Date(),
      });

      res.status(201).json({ msg: "Relatório criado com sucesso.", report: newReport });
    } catch (err) {
      next(err);
    }
  },

    
  // Gerar laudo e atualizar data de fechamento
  async generateReport (req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params;
      const { titulo, conteudo, peritoResponsavel } = req.body;

      const report = await Report.create({
        titulo,
        conteudo,
        peritoResponsavel,
        dataCriacao: new Date()
      });

      await Case.findByIdAndUpdate(caseId, {
        $set: { dataFechamento: new Date() }
      });

      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  },

  // Exportar relatório para PDF 
  async exportarPDF (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId).populate("peritoResponsavel").populate("casoRelacionado");

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              p { margin-bottom: 10px; }
              .info { margin-top: 20px; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <h1>${report.titulo}</h1>
            <p>${report.conteudo}</p>
            <div class="info">
              <p><strong>Perito Responsável:</strong> ${
                typeof report.peritoResponsavel === "object" && "nome" in report.peritoResponsavel
                  ? report.peritoResponsavel.nome
                  : "N/A"
              }</p>
              <p><strong>Data de Criação:</strong> ${new Date(report.dataCriacao).toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
      });

      await browser.close();

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${reportId}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  },

  // Listar todos os relatórios
  async listarRelatorios (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await Report.find().populate("peritoResponsavel casoRelacionado");
      res.status(200).json(reports);
    } catch (err) {
      next(err);
    }
  },

  // Buscar um relatório por ID
  async buscarPorId (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId).populate("peritoResponsavel casoRelacionado");

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }

      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  },
};