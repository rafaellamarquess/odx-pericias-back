import { Response, Request, NextFunction } from "express";
import UserModel from "../models/UserModel";

export const adminController = {


  
  // Gerenciar usuários
  gerenciarUsuarios: async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
      const usuarios = await UserModel.find();
      res.status(200).json(usuarios);
    } catch (err) {
      next(err);
    }
  },

  // Configurar sistema (exemplo: definir permissões, configurações gerais)
  configurarSistema: (req: Request, res: Response): void => {
    res.status(200).json({ msg: "Configurações do sistema atualizadas com sucesso." });
  },
};