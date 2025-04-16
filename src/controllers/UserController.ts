import { Request, Response, NextFunction } from "express";
import express from "express";
import User from "../models/UserModel";
import { CustomRequest } from "../types/CustomRequest";

// Lista todos os usuários
export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarios = await User.find();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error); 
  }
};

  //Editar Usuário
  export const editUser: express.RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;  // Recebe o ID do usuário a ser editado
      const { nome, email, perfil, rg, cro } = req.body;  // Dados para atualização
  
      // Verificar se o usuário é admin (permissão)
      if (!req.user || req.user.perfil !== "Admin") {
        res.status(403).json({ msg: "Apenas administradores podem editar outros usuários." });
        return;
      }
  
      // Procurar o usuário no banco
      const usuario = await User.findById(userId);
  
      if (!usuario) {
        res.status(404).json({ msg: "Usuário não encontrado." });
        return;
      }
  
      usuario.nome = nome || usuario.nome;
      usuario.email = email || usuario.email;
      usuario.perfil = perfil || usuario.perfil;
      usuario.rg = rg || usuario.rg;
      usuario.cro = cro || usuario.cro;
  
      await usuario.save();
  
      res.status(200).json({ msg: "Informações do usuário atualizadas com sucesso.", usuario });
    } catch (err) {
      next(err);
    }
  };

  // Deletar Usuário
export const deleteUser: express.RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!req.user || req.user.perfil !== "Admin") {
      res.status(403).json({ msg: "Apenas administradores podem deletar usuários." });
      return;
    }

    const usuarioDeletado = await User.findByIdAndDelete(userId);

    if (!usuarioDeletado) {
      res.status(404).json({ msg: "Usuário não encontrado." });
      return;
    }

    res.status(200).json({ msg: `Usuário "${usuarioDeletado.nome}" deletado com sucesso.` });
  } catch (err) {
    next(err);
  }
};