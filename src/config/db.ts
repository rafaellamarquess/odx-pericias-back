import mongoose, { Mongoose } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.set("strictQuery", true)


async function connectDB() {
  await mongoose.connect(`mongodb+srv://${process.env.DBUSER}:<${process.env.DBPASS}>@pericias.yvxgieo.mongodb.net/`

  );

  console.log("banco conectado com sucesso")
  
}


connectDB().catch((err)=> console.log(err))
export default connectDB;
