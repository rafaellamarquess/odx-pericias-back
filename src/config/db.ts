import mongoose from "mongoose";
import dotenv from "dotenv";
import { GridFSBucket } from "mongodb"; 

dotenv.config();


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB conectado!");
  } catch (err) {
    console.error("Erro ao conectar no MongoDB", err);
    process.exit(1);
  }
};


let gfs: GridFSBucket;

mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads", 
  });
  console.log("GridFS configurado!");
});

export { connectDB, gfs }; 