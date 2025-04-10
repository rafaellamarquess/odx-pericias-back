import { Router } from "express";
import { reportController } from "../controllers/reportController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

router.post("/", checkPermissions(Perfil.ADMIN, Perfil.PERITO), reportController.createReport);
router.post("/generate/:caseId", checkPermissions(Perfil.ADMIN, Perfil.PERITO), reportController.generateReport);
router.post("/sign/:reportId", checkPermissions(Perfil.ADMIN, Perfil.PERITO), reportController.assinarDigitalmente);
router.get("/pdf/:reportId", checkPermissions(Perfil.ADMIN, Perfil.PERITO), reportController.exportarPDF);
router.get("/", checkPermissions(Perfil.ADMIN, Perfil.PERITO), reportController.listarRelatorios);
router.get("/:reportId", checkPermissions(Perfil.ADMIN, Perfil.PERITO), reportController.buscarPorId);

export default router;
