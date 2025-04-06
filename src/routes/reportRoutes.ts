import { Router } from "express";
import { reportController } from "../controllers/reportController";

const router = Router();


router.post("/:reportId/pdf", reportController.exportarPDF);

export default router;
