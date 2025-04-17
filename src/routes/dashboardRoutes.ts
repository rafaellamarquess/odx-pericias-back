import express from "express";
import { DashboardController } from "../controllers/dashboardController";

const router = express.Router();

router.get("/filtrar-casos", DashboardController.filtrarCasos);

export default router;