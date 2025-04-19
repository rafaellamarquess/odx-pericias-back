import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.createReport);
router.post("/sing/:reportId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.assinarDigitalmente);
router.put("/update/:reportId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.updateReport);
router.delete("/delete/:reportId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.deleteReport);
router.get("/list", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.listReports);

export default router;
