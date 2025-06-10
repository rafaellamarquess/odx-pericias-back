import express from "express";
import { VitimaController } from "../controllers/VitimaController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();

router.get( "/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), VitimaController.listVitimas);
router.get( "/:id", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), VitimaController.getVitimaById);

export default router;