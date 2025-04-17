import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.createReport);
router.post("/sing/:reportId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.assinarDigitalmente);
router.put("/update/:reportId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.updateReport);
router.delete("/delete/:reportId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.deleteReport);
router.get("/list", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), ReportController.listReports);

export default router;
