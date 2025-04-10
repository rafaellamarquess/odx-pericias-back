import express from "express";
import multer from "multer";
import upload from "../middlewares/uploadMiddleware";
import { evidenceController } from "../controllers/evidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();
const multerUpload = multer({ dest: "uploads/" });

router.post("/text", checkPermissions(Perfil.ADMIN, Perfil.PERITO, Perfil.ASSISTENTE), evidenceController.uploadTextEvidence);
router.post("/image", multerUpload.single("file"), checkPermissions(Perfil.ADMIN, Perfil.PERITO, Perfil.ASSISTENTE), evidenceController.uploadImageEvidence);
router.post("/:caseId", checkPermissions(Perfil.ADMIN, Perfil.PERITO), evidenceController.addEvidence);
router.post("/coletar", checkPermissions(Perfil.ADMIN, Perfil.PERITO), evidenceController.coletarEvidencias);
router.post("/analisar", checkPermissions(Perfil.ADMIN, Perfil.PERITO), evidenceController.analisarEvidencias);
router.get("/enviar", checkPermissions(Perfil.ADMIN, Perfil.PERITO), evidenceController.enviarDados);
router.post("/gerar-laudo/:caseId", checkPermissions(Perfil.ADMIN, Perfil.PERITO), evidenceController.gerarLaudo);

export default router;