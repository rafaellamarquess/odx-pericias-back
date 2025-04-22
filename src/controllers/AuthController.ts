import { Request, Response, NextFunction } from "express";
import express from "express";
import User, { IUser } from "../models/UserModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { CustomRequest } from "../types/CustomRequest";
import { getUserFromToken } from "../utils/authUtils";
import { v4 as uuidv4 } from "uuid";
import { sendResetPasswordEmail } from "../utils/emailUtils";

// Função para login
export const login: express.RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
export const logout: express.RequestHandler = (req: Request, res: Response): void => {
  res.status(200).json({ message: "Logout bem-sucedido" });
};

// Função para retornar os dados do usuário logado
export const getLoggedUser = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    req.user = user;

    const userData = user as IUser;
    const userId =
      userData._id ? (typeof userData._id === "object" ? userData._id.toString() : userData._id) : null;

    res.status(200).json({
      id: userId,
      nome: userData.nome,
      cro: userData.cro || "",
      perfil: userData.perfil.toLowerCase(),
    });
  } catch (err: any) {
    if (err.status && err.msg) {
      res.status(err.status).json({ msg: err.msg });
    } else {
      res.status(500).json({ msg: "Erro no servidor." });
    }
  }
};

// Atualizar credenciais (senha ou e-mail)
export const updateCredencial: express.RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { newPassword, oldPassword, newEmail } = req.body;
    if (!newPassword && !newEmail) {
      res.status(400).json({ msg: "É necessário fornecer uma senha ou um e-mail para atualização." });
      return;
    }

    const user = await getUserFromToken(req.headers.authorization);
    req.user = user;

    // Atualizar senha, se necessário
    if (newPassword) {
      if (!oldPassword) {
        res.status(400).json({ msg: "Senha antiga é necessária para a alteração de senha." });
        return;
      }

      const isMatch = await bcrypt.compare(oldPassword, user.senha);
      if (!isMatch) {
        res.status(401).json({ msg: "Senha antiga inválida." });
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        res.status(400).json({
          msg: "A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.",
        });
        return;
      }

      user.senha = await bcrypt.hash(newPassword, 10);
    }

    // Atualizar e-mail, se necessário
    if (newEmail) {
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) {
        res.status(400).json({ msg: "Este e-mail já está em uso." });
        return;
      }

      user.email = newEmail;
    }

    await user.save();
    res.status(200).json({ msg: "Informações atualizadas com sucesso." });
  } catch (err: any) {
    if (err.status && err.msg) {
      res.status(err.status).json({ msg: err.msg });
    } else {
      next(err);
    }
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

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ msg: "Token inválido ou expirado." });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({
        msg: "A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.",
      });
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