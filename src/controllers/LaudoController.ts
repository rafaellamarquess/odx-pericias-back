import { Request, Response, NextFunction } from "express";
import { Laudo } from "../models/LaudoModel";
import { Evidence } from "../models/EvidenceModel";
import { User } from "../models/UserModel"; // Certifique-se de que o User está corretamente importado
import mongoose from "mongoose";

const LaudoController = {
  // Criar laudo
  async createLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        evidencia,
        perito,
        dadosAntemortem,
        dadosPostmortem,
        analiseLesoes,
        conclusao,
        assinaturaDigital
      } = req.body;

      if (!evidencia || !perito || !dadosAntemortem || !dadosPostmortem || !analiseLesoes || !conclusao) {
        res.status(400).json({ msg: "Todos os campos obrigatórios devem ser preenchidos." });
        return;
      }

      // Validar se evidência e perito existem
      const foundEvidence = await Evidence.findById(evidencia);
      const foundPerito = await User.findById(perito);

      if (!foundEvidence) {
        res.status(404).json({ msg: "Evidência não encontrada." });
        return;
      }

      if (!foundPerito) {
        res.status(404).json({ msg: "Perito não encontrado." });
        return;
      }

      const novoLaudo = await Laudo.create({
        evidencia,
        perito,
        dadosAntemortem,
        dadosPostmortem,
        analiseLesoes,
        conclusao,
        assinaturaDigital
      });

      res.status(201).json({ msg: "Laudo criado com sucesso.", laudo: novoLaudo });
    } catch (err) {
      next(err);
    }
  },

  // Editar laudo
  async updateLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;
      const allowedFields = [
        "dadosAntemortem",
        "dadosPostmortem",
        "analiseLesoes",
        "conclusao",
        "assinaturaDigital"
      ];

      const updateFields: any = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });

      const updatedLaudo = await Laudo.findByIdAndUpdate(
        laudoId,
        updateFields,
        { new: true }
      );

      if (!updatedLaudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      res.status(200).json({ msg: "Laudo atualizado com sucesso.", laudo: updatedLaudo });
    } catch (err) {
      next(err);
    }
  },

  // Listar todos os laudos
  async listLaudos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const laudos = await Laudo.find()
        .populate("evidencia")
        .populate("perito", "nome email"); // ajusta os campos conforme seu model

      res.status(200).json({ laudos });
    } catch (err) {
      next(err);
    }
  },

  // Deletar laudo
  async deleteLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;

      const deleted = await Laudo.findByIdAndDelete(laudoId);

      if (!deleted) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      res.status(200).json({ msg: "Laudo deletado com sucesso." });
    } catch (err) {
      next(err);
    }
  }
};

export default LaudoController;