import express from "express";
import { listUsers, login, logout, register } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/listusers", listUsers);

export default router;
