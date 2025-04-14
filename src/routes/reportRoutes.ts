import { Router } from "express";
import { reportController } from "../controllers/reportController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

// Gera um relatório para um caso
router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), reportController.gerarRelatorioCaso);
router.post("/sing/:reportId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), reportController.assinarDigitalmente);
router.put("/:reportId",checkPermissions([Perfil.ADMIN, Perfil.PERITO]),reportController.atualizarRelatorioCaso);
router.delete("/:reportId",checkPermissions([Perfil.ADMIN, Perfil.PERITO]),reportController.deletarRelatorioCaso);

export default router;