import { Router } from "express";
import LaudoController from "../controllers/LaudoController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

router.post("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), LaudoController.createLaudo);
// router.post("/sign/:laudoId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), LaudoController.signLaudo);

router.get("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), LaudoController.listLaudos);
router.put("/:laudoId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), LaudoController.updateLaudo);
router.delete( "/:laudoId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), LaudoController.deleteLaudo);


export default router;