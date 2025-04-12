import { NextFunction, Response, Request } from "express";
import cloudinary from "../config/cloudinary";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel"; // importa o model do caso

export const evidenceController = {
  // Adicionar evidência
  async addEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseTitle, tipo } = req.params;
      const { categoria, vitima, sexo, estadoCorpo, lesoes, coletadoPor, conteudo } = req.body;

      // Busca o caso pelo título
      const foundCase = await Case.findOne({ titulo: caseTitle });

      if (!foundCase) {
        return res.status(404).json({ msg: "Caso não encontrado com esse título." });
      }

      const caseId = foundCase._id;
      let evidence;

      if (tipo === "imagem" && req.file?.path) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "evidencias",
          use_filename: true,
          unique_filename: false
        });

        evidence = await Evidence.create({
          tipo: "imagem",
          categoria,
          vitima,
          sexo,
          estadoCorpo,
          lesoes,
          caso: caseId,
          coletadoPor,
          imagemURL: result.secure_url
        });
      }

      if (tipo === "texto") {
        evidence = await Evidence.create({
          tipo: "texto",
          categoria,
          vitima,
          sexo,
          estadoCorpo,
          lesoes,
          caso: caseId,
          coletadoPor,
          conteudo
        });
      }

      if (evidence) {
        res.status(200).json({ msg: "Evidência adicionada com sucesso.", evidence });
      } else {
        res.status(400).json({ msg: "Falha ao adicionar evidência. Tipo inválido ou dados ausentes." });
      }
    } catch (err) {
      next(err);
    }
  }
};
