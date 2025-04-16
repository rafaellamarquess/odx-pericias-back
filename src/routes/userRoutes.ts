import express from "express";
import { deleteUser, editUser, listUsers } from "../controllers/UserController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();

router.get("/userId", listUsers);
router.put("/:userId", authenticateToken, checkPermissions([Perfil.ADMIN]), editUser);
router.delete("/:userId", authenticateToken, checkPermissions([Perfil.ADMIN]), deleteUser);

export default router;