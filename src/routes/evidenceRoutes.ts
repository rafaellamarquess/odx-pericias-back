import express from "express";
import multer from "multer";
import { EvidenceController } from "../controllers/EvidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();
const multerUpload = multer({ dest: "uploads/" });

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]),  multerUpload.single("arquivo"), EvidenceController.createEvidence);
router.put("/update/:evidenceId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.updateEvidence);
router.delete("/delete/:evidenceId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.deleteEvidence);
router.get("/list", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.listEvidences);


// Rota para adicionar evidências a partir do caso title
// router.post("/:caseTitle/:tipo", upload.single("file"), checkPermissions([Perfil.ADMIN, Perfil.PERITO]), EvidenceController.createEvidence);


export default router;