import { Router } from "express";
import { reportController } from "../controllers/reportController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), reportController.gerarRelatorioCaso);
router.post("/sing/:reportId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), reportController.assinarDigitalmente);

export default router;
