import { Router } from "express";
import userRoutes from "./userRoutes";
import evidenceRoutes from "./evidenceRoutes";
import reportRoutes from "./reportRoutes";
import caseRoutes from "./caseRoutes";
import authRoutes from "./authRoutes";

const router = Router();

// Agrupamento das rotas
router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/evidence", evidenceRoutes);
router.use("/report", reportRoutes);
router.use("/cases", caseRoutes); 

export default router;