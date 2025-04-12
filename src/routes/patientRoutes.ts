import express from "express";
import multer from "multer";
import { patientController } from "../controllers/patientController";
import { checkPermissions } from "../middlewares/permissionsMiddleware";
import { Perfil } from "../models/UserModel";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), patientController.createPatient);
router.post("/dentalrecord/upload", checkPermissions([Perfil.ADMIN, Perfil.PERITO]), upload.single("imagem"), patientController.uploadDentalRecord);
router.get("/detalrecord", checkPermissions([Perfil.ADMIN, Perfil.PERITO, Perfil.ASSISTENTE]), patientController.listDentalRecords);

export default router;