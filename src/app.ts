import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";

require("dotenv").config()

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const UploadRouter = require ("./routes/picture")

app.use("/pictures", UploadRouter)

export default app;
