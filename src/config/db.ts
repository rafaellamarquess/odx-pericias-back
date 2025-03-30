import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@pericias.yvxgieo.mongodb.net/?retryWrites=true&w=majority&appName=Pericias`);
    console.log("MongoDB conectado!");
  } catch (err) {
    console.error("Erro ao conectar no MongoDB", err);
    process.exit(1);
  }
};

export default connectDB;


