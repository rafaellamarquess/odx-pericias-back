import mongoose, { Document, Schema, Types } from "mongoose";

interface IVitima extends Document {
  _id: Types.ObjectId;
  nome?: string;
  dataNascimento?: Date;
  idadeAproximada?: number;
  nacionalidade?: string;
  cidade?: string;
  sexo: "masculino" | "feminino" | "indeterminado";
  estadoCorpo: "inteiro" | "fragmentado" | "carbonizado" | "putrefacto" | "esqueleto";
  lesoes?: string;
  identificada: boolean;
  cases: Types.ObjectId; 
}

const VitimaSchema = new Schema<IVitima>({
  nome: { type: String },
  dataNascimento: { type: Date },
  idadeAproximada: { type: Number },
  nacionalidade: { type: String },
  cidade: { type: String },
  sexo: { type: String, enum: ["masculino", "feminino", "indeterminado"], required: true },
  estadoCorpo: {
    type: String,
    enum: ["inteiro", "fragmentado", "carbonizado", "putrefacto", "esqueleto"],
    required: true,
  },
  lesoes: { type: String },
  identificada: { type: Boolean, default: false },
  cases: { type: Schema.Types.ObjectId, ref: "Case", required: true },
});

const Vitima = mongoose.model<IVitima>("Vitima", VitimaSchema);
export { Vitima, IVitima };