import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.CLUSTER_URL}/${process.env.DBNAME}?retryWrites=true&w=majority&appName=odx-pericias`;
    
    await mongoose.connect(uri);
    console.log("MongoDB Atlas conectado com sucesso!");
  } catch (err) {
    if (err instanceof Error) {
      console.error("Erro ao conectar no MongoDB:", err.message);
    } else {
      console.error("Erro ao conectar no MongoDB:", err);
    }
    process.exit(1);
  }
};

export default connectDB;