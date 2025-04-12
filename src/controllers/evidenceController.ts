import { NextFunction, Response, Request } from "express";
import cloudinary from "../config/cloudinary";
import { TextEvidence } from "../models/TextEvidenceModel";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel";

export const evidenceController = {

 // Adicionar evidência
 async addEvidence(req: Request, res: Response, next: NextFunction) {
  try {
    const { caseId, tipo } = req.params;  // Caso e tipo (imagem ou texto)
    const { categoria, vitima, sexo, estadoCorpo, lesoes, coletadoPor } = req.body;

    let evidence;

    // Caso seja uma evidência de imagem
    if (tipo === "imagem" && req.file?.path) {
      // Envia a imagem para o Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "evidencias",
        use_filename: true,
        unique_filename: false
      });

      // Cria a evidência de imagem
      evidence = await Evidence.create({
        tipo: "imagem",
        categoria,
        vitima,
        sexo,
        estadoCorpo,
        lesoes,
        caso: caseId,
        coletadoPor,
        imagemURL: result.secure_url,  // URL da imagem no Cloudinary
      });
    }

    // Caso seja uma evidência de texto
    if (tipo === "texto") {
      evidence = await TextEvidence.create({
        tipo: "texto",
        dataColeta: new Date(),
        coletadoPor,
        conteudo: req.body.conteudo
      });
    }

    // Atualiza o caso com a nova evidência
    if (evidence) {
      const caso = await Case.findByIdAndUpdate(caseId, {
        $push: { evidencias: evidence._id }
      });
      res.status(200).json({ msg: "Evidência adicionada com sucesso.", evidence });
    } else {
      res.status(400).json({ msg: "Falha ao adicionar evidência. Tipo inválido ou dados ausentes." });
    }

    res.status(200).json({ msg: "Evidência adicionada com sucesso.", evidence });
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
