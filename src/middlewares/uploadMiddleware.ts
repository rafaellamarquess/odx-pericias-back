import dotenv from "dotenv";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
dotenv.config(); 

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => ({
    folder: `evidencias/${req.body.tipo || "geral"}`,
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  }),
});

const upload = multer({ storage: cloudinaryStorage });

export default upload;
