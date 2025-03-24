import { Request, Response, NextFunction } from "express";
import express from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const register: express.RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nome, email, senha, perfil } = req.body;
    const usuarioExiste = await User.findOne({ email });

    if (usuarioExiste) {
      res.status(400).json({ msg: "Usuário já existe" });
      return;
    }

    const novoUsuario = await User.create({ nome, email, senha, perfil });

    res.status(201).json({ msg: "Usuário cadastrado com sucesso!", usuario: novoUsuario });
  } catch (err) {
    next(err);
  }
};

export const login: express.RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, senha } = req.body;
    const usuario = await User.findOne({ email });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      res.status(401).json({ msg: "Credenciais inválidas" });
      return;
    }

    const token = jwt.sign({ id: usuario._id, perfil: usuario.perfil }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    res.json({ token, usuario });
  } catch (err) {
    next(err);
  }
};


// Função para listar todos os usuários
export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarios = await User.find();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error); 
  }
};