import express from "express";
import upload from "../middlewares/uploadMiddleware";
import { evidenceController } from "../controllers/evidenceController";

const router = express.Router();

// Rota com upload de imagem
router.post("/evidences/image-evidencia", upload.single("file"), evidenceController.uploadImageEvidence);


export default router;
