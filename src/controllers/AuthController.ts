import { Request, Response, NextFunction } from "express";
import express from "express";
import User, { IUser } from "../models/UserModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { CustomRequest } from "../types/CustomRequest";

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
export const getLoggedUser = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user as IUser; // Assert that user is of type IUser
    if (!user || typeof user._id !== "string") {
      res.status(404).json({ msg: "Usuário não encontrado" });
      return;
    }
    if (!user) {
      res.status(404).json({ msg: "Usuário não encontrado" });
      return;
    }

    res.status(200).json({
      id: user._id.toString(),
      nome: user.nome,
      cro: user.cro || "",
      tipo: user.perfil.toLowerCase(),
    });
  } catch (err: unknown) {
    next(err);
  }
};



//Redefinir senha ou email
export const forgotPassword: express.RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { newPassword, oldPassword, newEmail } = req.body;

    // Verificar se foi passado senha ou e-mail
    if (!newPassword && !newEmail) {
      res.status(400).json({ msg: "É necessário fornecer uma senha ou um e-mail para atualização." });
      return;
    }

    if (!req.user) {
      res.status(401).json({ msg: "Usuário não autenticado." });
      return;
    }
    const userId = req.user._id;
    const usuario = await User.findById(userId);

    if (!usuario) {
      res.status(404).json({ msg: "Usuário não encontrado." });
      return;
    }

    // Se for alteração de senha
    if (newPassword) {
      if (!oldPassword) {
        res.status(400).json({ msg: "Senha antiga é necessária para a alteração de senha." });
        return;
      }

      const isMatch = await bcrypt.compare(oldPassword, usuario.senha);
      if (!isMatch) {
        res.status(401).json({ msg: "Senha antiga inválida." });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      usuario.senha = hashedPassword;
    }

    // Se for alteração de e-mail
    if (newEmail) {
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) {
        res.status(400).json({ msg: "Este e-mail já está em uso." });
        return;
      }

      usuario.email = newEmail;
    }
    await usuario.save();

    res.status(200).json({ msg: "Informações atualizadas com sucesso." });
  } catch (err) {
    next(err);
  }
};

