import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rota de teste 
app.get("/", (_req, res) => {
  res.send("API ODX-Perícias está rodando com sucesso!");
});

// Todas as rotas centralizadas no /api
app.use("/api", routes);

export default app;