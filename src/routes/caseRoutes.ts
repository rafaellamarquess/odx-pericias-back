import { Router } from "express";
import { CaseController } from "../controllers/CaseController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = Router();

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.createCase);
router.get("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.listCases);
router.put("/:caseId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.updateCase);
router.delete("/:caseId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.deleteCase);
router.get("/case-title", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), CaseController.getCaseTittle);

export default router;
