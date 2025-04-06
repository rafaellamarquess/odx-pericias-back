import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import usersRoutes from "./routes/usersRoutes";
<<<<<<< HEAD
=======
import * as dotenv from "dotenv";

dotenv.config();
console.log("MONGO_URI do .env:", process.env.MONGO_URI); // Adicione isso
>>>>>>> gabriella

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", usersRoutes);

<<<<<<< HEAD

export default app;
=======
export default app;
>>>>>>> gabriella
