import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
import User from "../models/UserModel";
import { CustomRequest } from "../types/CustomRequest";

export const authenticateToken = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token não fornecido." });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in the environment variables.");
    }
    if (!token) {
      throw new Error("Token is undefined.");
    }
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); // 👈 obs: 'decoded.id' se no login você usou { id: usuario._id }

    if (!user) {
      res.status(401).json({ message: "Usuário não encontrado." });
    }

    if (user) {
      req.user = user;
    }
    return next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido." });
    return;
  }
};
