import mongoose, { Document, Schema } from "mongoose";

interface IEvidence extends Document {
  caso: mongoose.Types.ObjectId;
  casoReferencia?: string; // Adicionado para suportar o campo existente
  tipo: "imagem" | "texto";
  categoria: string;
  dataUpload: Date;
  vitima: "identificada" | "não identificada";
  sexo: "masculino" | "feminino" | "indeterminado";
  estadoCorpo: "inteiro" | "fragmentado" | "carbonizado" | "putrefacto" | "esqueleto";
  lesoes?: string;
  coletadoPor: string;
  conteudo?: string;
  imagemURL?: string;
  laudo?: string;
}

const EvidenceSchema = new Schema<IEvidence>({
  caso: { type: Schema.Types.ObjectId, ref: "Case", required: true },
  casoReferencia: { type: String }, // Campo opcional para referência legível
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
  coletadoPor: { type: String, required: true },
  conteudo: { type: String },
  imagemURL: { type: String },
  laudo: { type: String }
});

const Evidence = mongoose.model<IEvidence>("Evidence", EvidenceSchema);
export { Evidence, IEvidence };