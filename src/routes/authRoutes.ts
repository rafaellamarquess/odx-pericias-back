import express from "express";
import { getLoggedUser, listUsers, login, logout, register } from "../controllers/authController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/list-users", listUsers);
router.get("/logged-user", authenticateToken, getLoggedUser);

// router.get("/listusers", checkPermissions(Perfil.ADMIN), listUsers);


export default router;