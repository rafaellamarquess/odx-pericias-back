import express from "express";
import multer from "multer";
import { evidenceController } from "../controllers/evidenceController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();
const multerUpload = multer({ dest: "uploads/" });

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]),  multerUpload.single("file"), evidenceController.addEvidence);

export default router;