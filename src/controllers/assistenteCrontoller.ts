import { Request, Response, NextFunction } from "express";
import { Case } from "../models/CaseModel";

export const assistenteController = {
  // Coletar evidências
  coletarEvidencias: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { caseId, evidencias } = req.body;
      const caso = await Case.findById(caseId);

      if (!caso) {
      res.status(404).json({ msg: "Caso não encontrado" });
        return;
      }

      caso.evidencias.push(...evidencias); // Adiciona novas evidências ao caso
      await caso.save();
      res.status(200).json({ msg: "Evidências coletadas com sucesso", caso });
    } catch (err) {
      next(err);
    }
  },

  // Enviar dados
  enviarDados: (req: Request, res: Response) => {
    res.status(200).json({ msg: "Dados enviados com sucesso." });
  },
};