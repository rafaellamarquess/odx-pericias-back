import express from "express";
import multer from "multer";
import { evidenceController } from "../controllers/evidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();
const multerUpload = multer({ dest: "uploads/" });

router.post("/:caseId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), evidenceController.addEvidence);
router.post("/text", checkPermissions([Perfil.ADMIN, Perfil.PERITO, Perfil.ASSISTENTE]), evidenceController.uploadTextEvidence);
router.post("/image", multerUpload.single("file"), checkPermissions([Perfil.ADMIN, Perfil.PERITO, Perfil.ASSISTENTE]), evidenceController.uploadImageEvidence);
router.post("/coletar", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), evidenceController.coletarEvidencias);
router.post("/analisar", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), evidenceController.analisarEvidencias);
router.post("/gerar-laudo/:caseId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), evidenceController.gerarLaudo);
router.post("/assinar-laudo/:caseId", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), evidenceController.assinarDigitalmente);
router.get("/enviar", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), evidenceController.enviarDados);


export default router;