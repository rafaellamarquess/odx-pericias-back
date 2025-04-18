import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
import User from "../models/UserModel";
import { CustomRequest } from "../types/CustomRequest";

// Middleware de autenticação de token
export const authenticateToken = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1]; // Extrai o token do header Authorization

  if (!token) {
    res.status(401).json({ message: "Token não fornecido." });
    return;
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não está definido nas variáveis de ambiente.");
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: "Usuário não encontrado." });
      return;
    }

    req.user = user; 
    return next();
  } catch (error: any) {
    console.error("Erro ao verificar o token:", error.message); // Log de erro

    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expirado." });
    } else {
      res.status(401).json({ message: "Token inválido." });
    }
    return;
  }
};