import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomRequest } from '../types/CustomRequest';
import { IUser } from '../models/UserModel';

export const checkPermissions = (requiredPerfil: string) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
      // Verifica o token no cabeçalho da requisição
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ msg: "Acesso negado. Token não fornecido." });
        return;
      }

      // Decodifica o token JWT e extrai o ID e o perfil do usuário
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; perfil: string };


      req.user = { id: decoded.id, perfil: decoded.perfil } as IUser;       // Atribuind o usuário ao `req.user` com os dados do token

      // Verifica se o perfil do usuário é o esperado
      const userPerfil = req.user?.perfil;
      if (userPerfil !== requiredPerfil) {
        res.status(403).json({ msg: 'Acesso negado. Permissões insuficientes.' });
      }

      next();
    } catch (err) {
      res.status(401).json({ msg: "Token inválido ou expirado." });
    }
  };
};
