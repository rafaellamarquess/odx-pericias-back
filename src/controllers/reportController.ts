import { Request, Response, NextFunction } from "express";
import { Report } from "../models/ReportModel";

export const reportController = {
  // Criar um novo relatório
  async createReport(req: Request, res: Response, next: NextFunction) {
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

  // Assinar digitalmente o relatório
  async assinarDigitalmente(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId);

      if (!report) {
        return res.status(404).json({ msg: "Relatório não encontrado." });
      }

      report.assinaturaDigital();
      res.status(200).json({ msg: `Relatório "${report.titulo}" assinado digitalmente.` });
    } catch (err) {
      next(err);
    }
  },

  // Exportar relatório para PDF
  async exportarPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId);

      if (!report) {
        return res.status(404).json({ msg: "Relatório não encontrado." });
      }

      report.exportarPDF();
      res.status(200).json({ msg: `Relatório "${report.titulo}" exportado em PDF.` });
    } catch (err) {
      next(err);
    }
  },

  // Listar todos os relatórios
  async listarRelatorios(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await Report.find().populate("peritoResponsavel casoRelacionado");
      res.status(200).json(reports);
    } catch (err) {
      next(err);
    }
  },

  // Buscar um relatório por ID
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId).populate("peritoResponsavel casoRelacionado");

      if (!report) {
        return res.status(404).json({ msg: "Relatório não encontrado." });
      }

      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
};
