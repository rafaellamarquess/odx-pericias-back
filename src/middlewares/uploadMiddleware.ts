import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";


const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isAudio = file.mimetype.startsWith("audio/");
    return {
      folder: isAudio ? "reports/audio" : `evidencias/${req.body.tipo || "geral"}`,
      resource_type: isAudio ? "video" : "auto",
      allowed_formats: ["jpg", "png", "jpeg", "pdf", "mp3", "wav"],
    };
  },
});

const upload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;