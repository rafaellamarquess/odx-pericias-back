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

app.use(cors());
app.use(cors({
  origin: "https://odxpericias.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));


const swaggerDocument = YAML.load(path.join(__dirname, './docs/swagger.yaml'));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use("/api", routes);


// Rota de teste 
app.get("/", (_req, res) => {
  res.send("API ODX-Perícias está rodando com sucesso!");
});

export default app;