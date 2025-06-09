import mongoose, { Document, Schema } from "mongoose";

interface IEvidence extends Document {
  caso: mongoose.Types.ObjectId;
  vitima: mongoose.Types.ObjectId;
  tipo: "imagem" | "texto";
  categoria: string;
  dataUpload: Date;
  coletadoPor: mongoose.Types.ObjectId;
  imagem?: string;
  texto?: string;
}

const EvidenceSchema = new Schema<IEvidence>({
  caso: { type: Schema.Types.ObjectId, ref: "Case", required: true },
  vitima: { type: Schema.Types.ObjectId, ref: "Vitima", required: true },
  tipo: { type: String, enum: ["imagem", "texto"], required: true },
  categoria: { type: String, required: true },
  dataUpload: { type: Date, default: Date.now },
  coletadoPor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  texto: { type: String },
  imagem: { type: String },
});

const Evidence = mongoose.model<IEvidence>("Evidence", EvidenceSchema);
export { Evidence, IEvidence };