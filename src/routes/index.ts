import { Router } from "express";
import authRoutes from "./authRoutes";
import evidenceRoutes from "./evidenceRoutes";
import reportRoutes from "./reportRoutes";
import caseRoutes from "./caseRoutes";

const router = Router();

// Agrupamento das rotas
router.use("/auth", authRoutes);
router.use("/evidence", evidenceRoutes);
router.use("/report", reportRoutes);
router.use("/cases", caseRoutes); 

export default router;