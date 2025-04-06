import dotenv from "dotenv";
import connectDB from "./config/database"; // Caminho pode variar conforme onde está seu arquivo de conexão
import app from "./app"; // app.ts deve conter suas rotas e middlewares

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

startServer();
