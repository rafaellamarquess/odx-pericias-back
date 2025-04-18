import mongoose, { Document, Schema, Types } from "mongoose";
import { IEvidence } from "./EvidenceModel"; // Importe a interface de Evidence

interface ICase extends Document {
  titulo: string;
  descricao: string;
  status: "Em andamento" | "Finalizado" | "Arquivado";
  responsavel: string;
  dataCriacao: Date;
  casoReferencia: string; // Novo campo para o código de referência
  evidencias: Types.Array<IEvidence>;
}

const CaseSchema = new Schema<ICase>({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  status: { type: String, enum: ["Em andamento", "Finalizado", "Arquivado"], required: true },
  responsavel: { type: String, ref: "User", required: true },
  dataCriacao: { type: Date, default: Date.now },
  casoReferencia: { type: String, required: true, unique: true }, // Adiciona o campo de referência único
  evidencias: [{ type: Schema.Types.ObjectId, ref: "Evidence" }] // Relacionamento com a coleção Evidence
});

const Case = mongoose.model<ICase>("Case", CaseSchema);
export { Case, ICase };
