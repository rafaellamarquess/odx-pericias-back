import express from "express";
import { deleteUser, updateUser, listUsers, createUser } from "../controllers/UserController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();


router.post("/", authenticateToken, checkPermissions([Perfil.ADMIN]), createUser);
router.get("/",authenticateToken, checkPermissions([Perfil.ADMIN]), listUsers);
router.put("/:userId", authenticateToken, checkPermissions([Perfil.ADMIN]), updateUser);
router.delete("/:userId", authenticateToken, checkPermissions([Perfil.ADMIN]), deleteUser);

export default router;