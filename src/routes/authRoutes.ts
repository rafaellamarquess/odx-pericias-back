import express from "express";
import { forgotPassword, getLoggedUser, login, logout} from "../controllers/AuthController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/logged-user", authenticateToken, getLoggedUser);
router.post("forgot-password", authenticateToken, forgotPassword);

export default router;