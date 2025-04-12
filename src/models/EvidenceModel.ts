import mongoose, { Document, Schema } from "mongoose";

interface IEvidence extends Document {
  tipo: "imagem" | "texto";
  categoria: string;
  dataUpload: Date;
  vitima: "identificada" | "não identificada";
  sexo: "masculino" | "feminino" | "indeterminado";
  estadoCorpo: "inteiro" | "fragmentado" | "carbonizado" | "putrefacto" | "esqueleto";
  lesoes?: string;
  caso: mongoose.Types.ObjectId; // referência ao Case
  coletadoPor: mongoose.Types.ObjectId;
  imagemURL?: string; // URL da imagem no Cloudinary
}

const EvidenceSchema = new Schema<IEvidence>({
  tipo: { type: String, enum: ["imagem", "texto"], required: true },
  categoria: { type: String, required: true },
  dataUpload: { type: Date, default: Date.now },
  vitima: { type: String, enum: ["identificada", "não identificada"], required: true },
  sexo: { type: String, enum: ["masculino", "feminino", "indeterminado"], required: true },
  estadoCorpo: { 
    type: String, 
    enum: ["inteiro", "fragmentado", "carbonizado", "putrefacto", "esqueleto"], 
    required: true 
  },
  lesoes: { type: String },
  caso: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
  coletadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imagemURL: { type: String } // Armazena o link da imagem hospedada no Cloudinary
});

const Evidence = mongoose.model<IEvidence>("Evidence", EvidenceSchema);
export { Evidence, IEvidence };