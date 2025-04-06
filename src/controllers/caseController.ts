import { Request, Response, NextFunction } from "express";
import { Case } from "../models/CaseModel";
import { Evidence } from "../models/EvidenceModel";
import { Report } from "../models/ReportModel";

export const caseController = {
  async createCase(req: Request, res: Response, next: NextFunction) {
    try {
      const newCase = await Case.create(req.body);
      res.status(201).json(newCase);
    } catch (err) {
      next(err);
    }
  },

  async addEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params;
      const evidence = await Evidence.create(req.body);

      await Case.findByIdAndUpdate(caseId, {
        $push: { evidencias: evidence._id }
      });

      res.status(200).json({ msg: "Evidência adicionada com sucesso." });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params;
      const { status } = req.body;

      const updated = await Case.findByIdAndUpdate(caseId, { status }, { new: true });
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  async generateReport(req: Request, res: Response, next: NextFunction) {
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
  }
};
