import { Request, Response, NextFunction } from "express";
import express from "express";
import User from "../models/UserModel";
import { CustomRequest } from "../types/CustomRequest";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { sendResetPasswordEmail } from "../utils/emailUtils";

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

// Editar Usuário
export const updateUser: express.RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ msg: "Usuário não autenticado." });
      return;
    }

    if (req.user.perfil !== "Admin") {
      res.status(403).json({ msg: "Apenas administradores podem editar outros usuários." });
      return;
    }

    const { userId } = req.params;
    const { nome, email, perfil, rg, cro } = req.body;

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
    if (!req.user) {
      res.status(401).json({ msg: "Usuário não autenticado." });
      return;
    }

    if (req.user.perfil !== "Admin") {
      res.status(403).json({ msg: "Apenas administradores podem deletar usuários." });
      return;
    }

    const { userId } = req.params;

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

// Solicitar redefinição de senha
export const forgotPassword: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ msg: "E-mail não encontrado." });
      return;
    }

    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora

    await user.save();

    await sendResetPasswordEmail(email, resetToken);

    res.status(200).json({ msg: "E-mail de redefinição de senha enviado." });
  } catch (err) {
    next(err);
  }
};

// Redefinir a senha
export const resetPassword: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (newPassword.length < 8) {
      res.status(400).json({ msg: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ msg: "Token inválido ou expirado." });
      return;
    }

    user.senha = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({ msg: "Senha redefinida com sucesso." });
  } catch (err) {
    next(err);
  }
};