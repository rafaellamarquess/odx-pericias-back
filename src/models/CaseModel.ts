// models/Case.ts
import mongoose, { Document, Schema } from "mongoose";

interface ICase extends Document {
  titulo: string;
  descricao: string;
  status: "Em andamento" | "Finalizado" | "Arquivado";
  responsavel: string;
  dataCriacao: Date;
  addEvidence(evidenceId: mongoose.Types.ObjectId): void;
  updateStatus(status: string): void;
}

const CaseSchema = new Schema<ICase>({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  status: { type: String, enum: ["Em andamento", "Finalizado", "Arquivado"], required: true },
  responsavel: { type: String, ref: "User", required: true },
  dataCriacao: { type: Date, default: Date.now }
});

CaseSchema.methods.updateStatus = function (newStatus: string): void {
  this.status = newStatus;
};

const Case = mongoose.model<ICase>("Case", CaseSchema);
export { Case, ICase };