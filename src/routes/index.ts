import { Router } from "express";
import userRoutes from "./userRoutes";
import evidenceRoutes from "./evidenceRoutes";
import reportRoutes from "./reportRoutes";
import caseRoutes from "./caseRoutes";
import authRoutes from "./authRoutes";
import dashboardRoutes from "./dashboardRoutes";
import vitimaRoutes from "./vitimaRoutes";
import laudotRoutes from "./laudoRoutes";

const router = Router();

router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/case", caseRoutes); 
router.use("/evidence", evidenceRoutes);
router.use("/vitima", vitimaRoutes);
router.use('/laudo', laudotRoutes);
router.use("/report", reportRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;