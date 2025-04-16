import { Request, Response, NextFunction } from "express";
import express from "express";
import User from "../models/UserModel";
import { CustomRequest } from "../types/CustomRequest";

// Registrar um novo usuário
export const createUser: express.RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nome, email, senha, perfil, rg, cro } = req.body;

    if (!rg) {
      res.status(400).json({ msg: "RG é obrigatório" });
      return;
    }

    if (perfil === "Perito" && !cro) {
      res.status(400).json({ msg: "Cro é obrigatório para o perfil Perito" });
      return;
    }

    const usuarioExiste = await User.findOne({ email });

    if (usuarioExiste) {
      res.status(400).json({ msg: "Usuário já existe" });
      return;
    }

    const novoUsuario = await User.create({ nome, email, senha, perfil, rg, cro });

    res.status(201).json({ msg: "Usuário cadastrado com sucesso!", usuario: novoUsuario });
  } catch (err) {
    next(err);
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

// Lista todos os usuários
export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarios = await User.find();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error); 
  }
};