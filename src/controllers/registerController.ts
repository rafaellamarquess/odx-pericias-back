import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { nome, email, senha, perfil } = req.body;

  try {
    const newUser: InstanceType<typeof User> = new User({ nome, email, senha, perfil });
    await newUser.save(); 

    return res.status(201).json({ message: "Usuário registrado com sucesso!", user: newUser });
  } catch (err) {
    const errorMessage = (err as Error).message;
    return res.status(500).json({ error: errorMessage });
  }
};