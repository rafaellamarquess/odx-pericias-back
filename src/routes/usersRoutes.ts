import express from "express";
import { adminController } from "../controllers/adminController";
import { peritoController } from "../controllers/peritoController";
import { assistenteController } from "../controllers/assistenteCrontoller";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();

// Admin Routes
router.post("/admin/gerenciar-usuarios", checkPermissions(Perfil.ADMIN), adminController.gerenciarUsuarios);
router.post("/admin/configurar-sistema", checkPermissions(Perfil.ADMIN), adminController.configurarSistema);

// Perito Routes
router.post("/perito/cadastrar-caso", checkPermissions(Perfil.PERITO), peritoController.cadastrarCaso);
router.post("/perito/analisar-evidencias", checkPermissions(Perfil.PERITO), peritoController.analisarEvidencias);
router.post("/perito/gerar-laudo/:caseId", checkPermissions(Perfil.PERITO), peritoController.gerarLaudo);

// Assistente Routes
router.post("/assistente/coletar-evidencias", checkPermissions(Perfil.ASSISTENTE), assistenteController.coletarEvidencias);
router.post("/assistente/enviar-dados", checkPermissions(Perfil.ASSISTENTE), assistenteController.enviarDados);

export default router;