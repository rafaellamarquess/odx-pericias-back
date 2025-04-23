import express from "express";
import { EvidenceController } from "../controllers/EvidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import upload from "../middlewares/uploadMiddleware";
import { Perfil } from "../models/UserModel";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();


router.post("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]),  upload.single("file"), EvidenceController.createEvidence);
router.get("/", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.listEvidences);
router.put("/:evidenceId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.updateEvidence);
router.delete("/:evidenceId", authenticateToken, checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.deleteEvidence);


export default router;