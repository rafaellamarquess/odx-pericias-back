import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomRequest } from '../types/CustomRequest';
import { IUser } from '../models/UserModel';

export const checkPermissions = (...perfisPermitidos: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ msg: "Acesso negado. Token não fornecido." });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; perfil: string };

      req.user = { id: decoded.id, perfil: decoded.perfil } as IUser;

      const userPerfil = req.user.perfil;
      if (!perfisPermitidos.includes(userPerfil)) {
       res.status(403).json({ msg: "Acesso negado. Permissões insuficientes." });
      }

      next();
    } catch (err) {
     res.status(401).json({ msg: "Token inválido ou expirado." });
    }
  };
};
