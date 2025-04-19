import mongoose, { Document, Schema, Types } from "mongoose";
import { IEvidence } from "./EvidenceModel"; // Importe a interface de Evidence

interface ICase extends Document {
  titulo: string;
  descricao: string;
  status: "Em andamento" | "Finalizado" | "Arquivado";
  responsavel: string;
  cidade: string;
  estado: string;
  dataCriacao: Date;
  casoReferencia: string;
  evidencias: Types.Array<IEvidence>;
}

const CaseSchema = new Schema<ICase>({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  status: { type: String, enum: ["Em andamento", "Finalizado", "Arquivado"], required: true },
  responsavel: { type: String, ref: "User", required: true },
  dataCriacao: { type: Date, default: Date.now },
  cidade: { type: String, required: true },
  estado: { type: String, required: true },
  casoReferencia: { type: String, required: true, unique: true }, 
  evidencias: [{ type: Schema.Types.ObjectId, ref: "Evidence" }] 
});

const Case = mongoose.model<ICase>("Case", CaseSchema);
export { Case, ICase };
