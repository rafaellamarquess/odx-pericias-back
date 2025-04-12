import { Request, Response, NextFunction } from "express";
import { Case } from "../models/CaseModel";

export const caseController = {
  // Criar novo caso
  async createCase (req: Request, res: Response, next: NextFunction) {
    try {
      const { titulo, descricao, responsavel, dataCriacao } = req.body;
      const newCase = new Case({
        titulo,
        descricao,
        responsavel,
        dataCriacao: new Date(dataCriacao),
        status: "Em andamento",
        evidencias: [],
      });
      await newCase.save();
      res.status(201).json({ msg: "Caso cadastrado com sucesso!", caso: newCase });
    } catch (err) {
      next(err);
    }
  },

  // Atualizar status do caso
  async updateStatus (req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params;
      const { status } = req.body;

      const updated = await Case.findByIdAndUpdate(caseId, { status }, { new: true });
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  async finalizarCaso(req: Request, res: Response): Promise<void> {
    try {
      const { caseId } = req.params;
  
      const caso = await Case.findById(caseId);
      if (!caso) {
        res.status(404).json({ msg: "Caso não encontrado." });
        return;
      }
  
      caso.status = "Finalizado";
      await caso.save();
  
      // Aqui pode adicionar lógica para "assinar digitalmente" se necessário
      // Por exemplo: gerar uma hash, adicionar timestamp, ou apenas marcar como assinado
      res.status(200).json({ msg: `Caso "${caso.titulo}" finalizado com sucesso.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Erro ao finalizar caso." });
    }
  }

  
  //Atualizar Caso


  //Deletar Caso
};