import express from "express";
import { adminController } from "../controllers/adminController";
import { peritoController } from "../controllers/peritoController";
import { assistenteController } from "../controllers/assistenteCrontroller";
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
router.get("/perito/listar-casos", checkPermissions(Perfil.PERITO), peritoController.listarCasos);
router.get("/perito/buscar-casos", checkPermissions(Perfil.PERITO), peritoController.buscarCasos); 
router.get("/perito/visualizar-caso/:caseId", checkPermissions(Perfil.PERITO), peritoController.visualizarCaso); 

// Assistente Routes
router.post("/assistente/coletar-evidencias", checkPermissions(Perfil.ASSISTENTE), assistenteController.coletarEvidencias);
router.post("/assistente/enviar-dados", checkPermissions(Perfil.ASSISTENTE), assistenteController.enviarDados);

export default router;