import express from "express";
import upload from "../middlewares/uploadMiddleware";
import { evidenceController } from "../controllers/evidenceController";

const router = express.Router();

router.post("/image-evidencia", upload.single("file"), evidenceController.uploadImageEvidence);

export default router;
