import express from "express";
 import { DashboardController } from "../controllers/DashboardController";
 
 const router = express.Router();
 
 router.get("/", DashboardController.filtrarCasos);
 
 export default router;