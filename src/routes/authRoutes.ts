import express from "express";
import { updateCredencial, getLoggedUser, login, logout, forgotPassword, resetPassword } from "../controllers/AuthController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/logged-user", authenticateToken, getLoggedUser);
router.put("/update-credencial", authenticateToken, updateCredencial);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;