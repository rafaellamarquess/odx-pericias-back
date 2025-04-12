import { Router } from "express";
import { caseController } from "../controllers/caseController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), caseController.createCase);
router.patch("/:caseId/status", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), caseController.updateStatus);
router.patch("/:caseId/finalizar", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), caseController.finalizarCaso);
// router.put("/:caseId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), caseController.updateCase);
// router.delete("/:caseId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), caseController.deleteCase);

export default router;
