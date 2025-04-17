import express from "express";
import { EvidenceController } from "../controllers/EvidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import upload from "../middlewares/uploadMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]),  upload.single("file"), EvidenceController.createEvidence);
router.put("/update/:evidenceId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.updateEvidence);
router.delete("/delete/:evidenceId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.deleteEvidence);
router.get("/list", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.listEvidences);


// Rota para adicionar evidências a partir do caso title
// router.post("/:caseTitle/:tipo", upload.single("file"), checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.createEvidence);


export default router;