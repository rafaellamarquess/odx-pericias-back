import { Router } from "express";
import { caseController } from "../controllers/caseController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), caseController.createCase);
router.patch("/:caseId/status", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), caseController.updateStatus);
router.get("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO, Perfil.ASSISTENTE]), caseController.listarCasos);

export default router;
