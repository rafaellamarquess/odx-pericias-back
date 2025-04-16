import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.createReport);
router.post("/sing/:reportId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.assinarDigitalmente);

export default router;
