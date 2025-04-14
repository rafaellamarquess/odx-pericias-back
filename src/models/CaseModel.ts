// models/Case.ts
import mongoose, { Document, Schema } from "mongoose";

interface ICase extends Document {
  evidencias: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evidence" }],
  titulo: string;
  descricao: string;
  status: "Em andamento" | "Finalizado" | "Arquivado";
  responsavel: string;
  dataCriacao: Date;
  addEvidence(evidenceId: mongoose.Types.ObjectId): void;
  updateStatus(status: string): void;
}

const CaseSchema = new Schema<ICase>({
  evidencias: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evidence" }],
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  status: { type: String, enum: ["Em andamento", "Finalizado", "Arquivado"], required: true },
  responsavel: { type: String, ref: "User", required: true },
  dataCriacao: { type: Date, default: Date.now }
});

CaseSchema.methods.updateStatus = function (newStatus: string): void {
  this.status = newStatus;
};

CaseSchema.methods.addEvidence = function (evidenceId: mongoose.Types.ObjectId): void {
  this.evidencias.push(evidenceId);
};

const Case = mongoose.model<ICase>("Case", CaseSchema);
export { Case, ICase };