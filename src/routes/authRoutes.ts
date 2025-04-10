import express from "express";
import { listUsers, login, logout, register } from "../controllers/authController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/listusers", listUsers);


// router.get("/listusers", checkPermissions(Perfil.ADMIN), listUsers);


export default router;