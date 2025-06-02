import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { swaggerUi } from "./config/swagger";
import YAML from "yamljs";
import path from "path";


dotenv.config();

const app = express();
app.use(express.json());


const frontEndUrl = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(cors({
  origin: frontEndUrl,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.options("*", cors());

const swaggerDocument = YAML.load(path.join(__dirname, './docs/swagger.yaml'));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use("/api", routes);


// Rota de teste 
app.get("/", (_req, res) => {
  res.send("API ODX-Perícias está rodando com sucesso!");
});

export default app;