import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: `evidencias/${req.body.tipo}`, // pasta onde o arquivo será salvo
      allowed_formats: ["jpg", "png", "jpeg", "pdf"],
      // public_id: `${Date.now()}-${file.originalname}`, // opcional
    };
  },
});

const upload = multer({ storage });

export default upload;
