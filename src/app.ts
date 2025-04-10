import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { swaggerSpec, swaggerUi } from "./config/swagger";
import YAML from "yamljs";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const swaggerDocument = YAML.load("../docs/swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Rota de teste 
app.get("/", (_req, res) => {
  res.send("API ODX-Perícias está rodando com sucesso!");
});

// Todas as rotas centralizadas no /api
app.use("/api", routes);

export default app;