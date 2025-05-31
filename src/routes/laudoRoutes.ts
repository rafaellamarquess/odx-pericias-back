import { Router } from "express";
import LaudoController from "../controllers/LaudoController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

// Criar laudo
router.post(
  "/",
  authenticateToken,
  checkPermissions([Perfil.ADMIN, Perfil.PERITO]),
  LaudoController.createLaudo
);

// Atualizar laudo
router.put(
  "/update/:laudoId",
  authenticateToken,
  checkPermissions([Perfil.ADMIN, Perfil.PERITO]),
  LaudoController.updateLaudo
);

// Deletar laudo
router.delete(
  "/delete/:laudoId",
  authenticateToken,
  checkPermissions([Perfil.ADMIN, Perfil.PERITO]),
  LaudoController.deleteLaudo
);

// Listar laudos
router.get(
  "/list",
  authenticateToken,
  checkPermissions([Perfil.ADMIN, Perfil.PERITO]),
  LaudoController.listLaudos
);

export default router;