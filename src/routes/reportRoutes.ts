import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";
import { authenticateToken } from "../middlewares/authMiddleware";
import upload from "../middlewares/uploadMiddleware";

const router = Router();

router.post("/", upload.single("audio"),  authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.createReport);
router.post("/sign/:reportId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.assinarDigitalmente);
router.put("/update/:reportId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.updateReport);
router.delete("/delete/:reportId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.deleteReport);
router.get("/list", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.listReports);

export default router;
