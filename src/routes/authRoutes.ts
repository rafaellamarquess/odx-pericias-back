import express from "express";
import { getLoggedUser, listUsers, login, logout, register, updateCredencials } from "../controllers/authController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermissions } from "../middlewares/permissionsMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/list-users", listUsers);
router.get("/logged-user", authenticateToken, getLoggedUser);
router.post("update-credencials", authenticateToken, updateCredencials);


// router.get("/listusers", checkPermissions(Perfil.ADMIN), listUsers);


export default router;