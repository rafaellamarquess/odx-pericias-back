import { NextFunction, Response, Request } from "express";
import { CustomRequest } from "../types/CustomRequest";
import cloudinary from "../config/cloudinary";
import { ImageEvidence } from "../models/ImageEvidenceModel";
import { TextEvidence } from "../models/TextEvidenceModel";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel";

export const evidenceController = {

 // Adicionar evidência
 async addEvidence(req: Request & { params: { caseId: string } }, res: Response, next: NextFunction) {
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

  // Analisar evidências
  async analisarEvidencias(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId, evidencias } = req.body;
      const caso = await Case.findById(caseId);

      if (!caso) {
        res.status(404).json({ msg: "Caso não encontrado" });
        return;
      }

      caso.evidencias = evidencias;
      await caso.save();

      res.status(200).json({ msg: "Evidências analisadas com sucesso", caso });
    } catch (err) {
      next(err);
    }
  },



  uploadImageEvidence: async (req: CustomRequest, res: Response): Promise<void> => {
    try {
      if (!req.file?.path) {
        res.status(400).json({ msg: "Arquivo não enviado." });
        return;
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "evidences",
      });

      const novaEvidencia = await ImageEvidence.create({
        tipo: "imagem",
        dataColeta: new Date(),
        coletadoPor: req.user!._id,
        imagemURL: result.secure_url,
      });

      res.status(201).json(novaEvidencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Erro ao enviar imagem." });
    }
  },

  uploadTextEvidence: async (req: CustomRequest, res: Response): Promise<void> => {
    try {
      const { conteudo } = req.body;

      const novaEvidencia = await TextEvidence.create({
        tipo: "texto",
        dataColeta: new Date(),
        coletadoPor: req.user!._id,
        conteudo,
      });

      res.status(201).json(novaEvidencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Erro ao enviar texto." });
    }
  },


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
  
    // Gerar laudo (placeholder genérico)
    async gerarLaudo(req: Request, res: Response, next: NextFunction) {
      try {
        const { caseId } = req.params;
        const caso = await Case.findById(caseId);
  
        if (!caso) {
          res.status(404).json({ msg: "Caso não encontrado" });
          return;
        }
  
        // lógica futura de geração real de laudo
        res.status(200).json({ msg: "Laudo gerado com sucesso", caso });
      } catch (err) {
        next(err);
      }
    },

      // Assinar digitalmente o Laudo
      async assinarDigitalmente(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
          const { caseId } = req.params;
          const caso = await Case.findById(caseId);
    
          if (!caso) {
            res.status(404).json({ msg: "Relatório não encontrado." });
            return;
          }
    
          caso.assinaturaDigital();
          res.status(200).json({ msg: `Relatório "${caso.titulo}" assinado digitalmente.` });
        } catch (err) {
          next(err);
        }
      },
};
