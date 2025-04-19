import express from "express";
import { EvidenceController } from "../controllers/EvidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import upload from "../middlewares/uploadMiddleware";
import { Perfil } from "../models/UserModel";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]),  upload.single("file"), EvidenceController.createEvidence);
router.put("/update/:evidenceId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.updateEvidence);
router.delete("/delete/:evidenceId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.deleteEvidence);
router.get("/list", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.listEvidences);


// Rota para adicionar evidências a partir do caso title
// router.post("/:caseTitle/:tipo", upload.single("file"), checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.createEvidence);


export default router;