import express from "express";
import { listUsers, login, register } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", listUsers);

export default router;
