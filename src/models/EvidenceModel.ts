import mongoose, { Document, Schema } from "mongoose";

interface IEvidence extends Document {
  casoReferencia: string;
  tipo: "imagem" | "texto";
  categoria: string;
  dataUpload: Date;
  vitima: "identificada" | "não identificada";
  sexo: "masculino" | "feminino" | "indeterminado";
  estadoCorpo: "inteiro" | "fragmentado" | "carbonizado" | "putrefacto" | "esqueleto";
  lesoes?: string;
  coletadoPor: string; // Agora é uma string com o nome do coletor
  conteudo?: string;
  imagemURL?: string;
  laudo?: string;
}

const EvidenceSchema = new Schema<IEvidence>({
  casoReferencia: { type: String, unique: true, required: true },
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
  coletadoPor: { type: String, required: true }, // Alterado para string
  conteudo: { type: String },
  imagemURL: { type: String },
  laudo: { type: String }
});

const Evidence = mongoose.model<IEvidence>("Evidence", EvidenceSchema);
export { Evidence, IEvidence };
