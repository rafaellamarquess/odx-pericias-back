import { Request, Response, NextFunction } from "express";
import express from "express";
import User from "../models/UserModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { CustomRequest } from "../types/CustomRequest";


// Função para registrar um novo usuário
export const register: express.RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

// Função para login
export const login: express.RequestHandler = async ( req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, senha } = req.body;

    const usuario = await User.findOne({ email });

    if (!usuario) {
      res.status(401).json({ msg: "Credenciais inválidas" });
      return;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      res.status(401).json({ msg: "Credenciais inválidas" });
      return;
    }

    const token = jwt.sign(
      { id: usuario._id, perfil: usuario.perfil },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, usuario });
  } catch (err) {
    next(err);
  }
};

// Função logout
export const logout: express.RequestHandler = (req: Request, res: Response): void  => {
  res.status(200).json({ message: "Logout bem-sucedido" });
};


// Função para retornar os dados do usuário logado
export const getLoggedUser = async (req: CustomRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Não autorizado." });
    return;
  }

  res.status(200).json(req.user);
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


  //Editar Usuário

  // Deletar Usuário
