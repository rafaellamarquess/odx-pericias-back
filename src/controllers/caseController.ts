import { Request, Response, NextFunction } from "express";
import { Case } from "../models/CaseModel";
import { CustomRequest } from "../types/CustomRequest";

export const caseController = {
    // Criar novo caso
    async createCase(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const user = req.user;

        if (!user) {
         res.status(401).json({ msg: "Usuário não autenticado." });
         return;
        }
  
        // Verificar se o perfil do usuário é 'Admin' ou 'Perito'
        if (user.perfil !== "Admin" && user.perfil !== "Perito") {
         res.status(403).json({ msg: "Apenas usuários com perfil 'Admin' ou 'Perito' podem cadastrar casos." });
        }
  
        const { titulo, descricao, responsavel, dataCriacao } = req.body;
  
        const newCase = new Case({
          titulo,
          descricao,
          responsavel,
          dataCriacao: new Date(dataCriacao),
          status: "Em andamento",
        });
  
        await newCase.save();
        res.status(201).json({ msg: "Caso cadastrado com sucesso!", caso: newCase });
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
      res.status(200).json({ msg: `Caso "${caso.titulo}" finalizado com sucesso.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Erro ao finalizar caso." });
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
  
  //Atualizar Caso


  //Deletar Caso
};