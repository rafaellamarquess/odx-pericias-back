import { Router } from "express";
import userRoutes from "./userRoutes";
import evidenceRoutes from "./evidenceRoutes";
import reportRoutes from "./reportRoutes";
import caseRoutes from "./caseRoutes";
import authRoutes from "./authRoutes";
import dashboardRoutes from "./dashboardRoutes";
import vitimaRoutes from "./vitimaRoutes";

const router = Router();

router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/evidence", evidenceRoutes);
router.use("/vitima", vitimaRoutes);
router.use("/report", reportRoutes);
router.use('/laudo', reportRoutes); // Assuming reportRoutes handles laudo as well
router.use("/case", caseRoutes); 
router.use("/dashboard", dashboardRoutes);

export default router;