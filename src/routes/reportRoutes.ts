import { Router } from "express";
import { reportController } from "../controllers/reportController";

const router = Router();

router.post("/", reportController.createReport);
router.get("/", reportController.listarRelatorios);
router.get("/:reportId", reportController.buscarPorId);
router.post("/:reportId/assinar", reportController.assinarDigitalmente);
router.post("/:reportId/exportar", reportController.exportarPDF);

export default router;
