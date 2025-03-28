import { Request, Response, NextFunction } from "express";
import { Case } from "../models/CaseModel";

export const peritoController = {
  // Cadastrar um novo caso
  cadastrarCaso: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { titulo, descricao, responsavel } = req.body;
      const novoCaso = new Case({
        titulo,
        descricao,
        status: "Em andamento", // Status inicial
        responsavel, // No caso é o nome do Perito que criou o caso
        evidencias: [],
      });
      await novoCaso.save();
      res.status(201).json({ msg: "Caso cadastrado com sucesso!", caso: novoCaso });
    } catch (err) {
      next(err);
    }
  },

  // Analisar evidências de um caso
  analisarEvidencias: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { caseId, evidencias } = req.body;
      const caso = await Case.findById(caseId);

      if (!caso) {
         res.status(404).json({ msg: "Caso não encontrado" });
         return;
      }

       // Adiciona ou altera as evidências do caso
      caso.evidencias = evidencias;
      await caso.save();
      res.status(200).json({ msg: "Evidências analisadas com sucesso", caso });
    } catch (err) {
      next(err);
    }
  },

  // Gerar laudo do caso
  gerarLaudo: async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try {
      const { caseId } = req.params;
      const caso = await Case.findById(caseId);

      if (!caso) {
       res.status(404).json({ msg: "Caso não encontrado" });
      }

      // Lógica para gerar o laudo: processamento de evidências, geração de documentos, etc....
      res.status(200).json({ msg: "Laudo gerado com sucesso", caso });
    } catch (err) {
      next(err);
    }
  },
};
