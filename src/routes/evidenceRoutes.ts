import express from "express";
import multer from "multer";
import { EvidenceController } from "../controllers/EvidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();
const multerUpload = multer({ dest: "uploads/" });

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]),  multerUpload.single("file"), EvidenceController.addEvidence);

export default router;