import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Configuração do Mongoose
mongoose.set("strictQuery", true); // Recomendado para evitar warnings

async function connectDB(): Promise<void> {
  try {
    // Verificação segura das variáveis de ambiente
    const dbUser = process.env.DBUSER;
    const dbPass = process.env.DBPASS;
    
    if (!dbUser || !dbPass) {
      throw new Error("Credenciais do banco de dados não configuradas no .env");
    }

    // Codificação segura da senha
    const encodedPassword = encodeURIComponent(dbPass);
    
    // String de conexão atualizada
    const uri = `mongodb+srv://${dbUser}:${encodedPassword}@pericias.yvxgieo.mongodb.net/pericias?retryWrites=true&w=majority`;
    
    // Conexão sem opções obsoletas
    await mongoose.connect(uri);
    
    console.log("✅ Banco de dados conectado com sucesso");
  } catch (err) {
    console.error("❌ Erro na conexão com o banco:", err);
    process.exit(1); // Encerra o processo com erro
  }
}

// Eventos de conexão
mongoose.connection.on("connected", () => {
  console.log("📊 Conectado ao MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("🔥 Erro na conexão:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🚪 Desconectado do MongoDB");
});

export default connectDB;