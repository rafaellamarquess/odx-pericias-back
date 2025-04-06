import { Response } from "express";
import { CustomRequest } from "../types/CustomRequest";
import cloudinary from "../config/cloudinary";
import { ImageEvidence } from "../models/ImageEvidenceModel";
import { TextEvidence } from "../models/TextEvidenceModel";

export const evidenceController = {
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
};
