import { Router } from "express";
import authRoutes from "./authRoutes";
import evidenceRoutes from "./evidenceRoutes";
import reportRoutes from "./reportRoutes";
import perfisRoutes from "./perfisRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/evidence", evidenceRoutes);
router.use("/report", reportRoutes);
router.use("/user", perfisRoutes);

export default router;
