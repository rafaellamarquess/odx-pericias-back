import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: `evidencias/${req.body.tipo}`,
      allowed_formats: ["jpg", "png", "jpeg", "pdf"],
    };
  },
});

const upload = multer({ storage });

export default upload;