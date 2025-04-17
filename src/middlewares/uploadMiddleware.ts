import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => ({
    folder: `evidencias/${req.body.tipo || "geral"}`,
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  }),
});

const upload = multer({ storage: cloudinaryStorage });

export default upload;
