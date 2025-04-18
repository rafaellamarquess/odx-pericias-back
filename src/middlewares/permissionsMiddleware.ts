import { Response, NextFunction } from "express";
import { CustomRequest } from "../types/CustomRequest";

export const checkPermissions = (perfisPermitidos: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ msg: "Acesso negado. Usuário não autenticado." });
        return;
      }

      const userPerfil = req.user.perfil;
      if (!perfisPermitidos.includes(userPerfil)) {
        res.status(403).json({ msg: "Acesso negado. Permissões insuficientes." });
        return;
      }

      next();
    } catch (err) {
      res.status(401).json({ msg: "Erro na verificação de permissões." });
    }
  };
};
