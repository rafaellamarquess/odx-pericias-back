import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ msg: "Acesso negado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).usuario = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token inválido" });
  }
};
