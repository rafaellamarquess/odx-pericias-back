import express from "express";
import { EvidenceController } from "../controllers/EvidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import upload from "../middlewares/uploadMiddleware";
import { Perfil } from "../models/UserModel";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();


router.post("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]),  upload.single("file"), EvidenceController.createEvidence);
router.get("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.listEvidences);
router.get("/filters",authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.getFilterOptions);
router.put("/:evidenceId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.updateEvidence);
router.get("/:evidenceId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.getEvidenceById);
router.delete("/:evidenceId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.deleteEvidence);


export default router;