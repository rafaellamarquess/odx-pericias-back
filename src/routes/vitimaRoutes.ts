import express from "express";
import { VitimaController } from "../controllers/VitimaController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();

router.get( "/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), VitimaController.listVitimas);

export default router;