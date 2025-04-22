// routes/case.routes.ts
import { Router } from "express";
import { CaseController } from "../controllers/CaseController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.createCase);
router.get("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.listCases);
router.put("/:caseId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.updateCase);
router.delete("/:caseId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.deleteCase);

router.get("/:caseId/evidences",authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.getEvidencesByCaseId);

export default router;
