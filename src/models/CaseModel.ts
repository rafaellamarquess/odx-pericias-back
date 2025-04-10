import mongoose, { Document, Schema } from "mongoose";

interface ICase extends Document {
  titulo: string;
  descricao: string;
  status: "Em andamento" | "Finalizado" | "Arquivado";
  responsavel: mongoose.Types.ObjectId;
  evidencias: mongoose.Types.ObjectId[];
  dataCriacao: Date;
  addEvidence(evidenceId: mongoose.Types.ObjectId): void;
  updateStatus(status: string): void;
  assinaturaDigital: () => void;
}

const CaseSchema = new Schema<ICase>({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  status: { type: String, enum: ["Em andamento", "Finalizado", "Arquivado"], required: true },
  responsavel: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  evidencias: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evidence" }],
  dataCriacao: { type: Date, default: Date.now }
});

CaseSchema.methods.addEvidence = function (evidenceId: mongoose.Types.ObjectId): void {
  this.evidencias.push(evidenceId);
};

CaseSchema.methods.assinaturaDigital = function () {
  console.log(`Caso "${this.titulo}" assinado digitalmente.`);
};

CaseSchema.methods.updateStatus = function (newStatus: string): void {
  this.status = newStatus;
};

const Case = mongoose.model<ICase>("Case", CaseSchema);
export { Case, ICase };
