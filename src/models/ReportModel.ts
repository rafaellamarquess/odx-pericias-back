import mongoose, { Document, Schema, Types } from "mongoose";
import { ICase } from "./CaseModel"; // Importe a interface de Case
import { IEvidence } from "./EvidenceModel"; // Importe a interface de Evidence

interface IReport extends Document {
  titulo: string;
  descricao: string;
  objetoPericia: string;
  analiseTecnica: string;
  metodoUtilizado: string;
  destinatario: string;
  materiaisUtilizados: string;
  examesRealizados: string;
  consideracoesTecnicoPericiais: string;
  conclusaoTecnica: string;
  caso: Types.ObjectId | ICase; // Pode ser ObjectId ou ICase após populate
  evidencias: Types.Array<IEvidence>;
  criadoEm: Date;
  assinadoDigitalmente: boolean;
}

const ReportSchema = new Schema<IReport>({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  objetoPericia: { type: String, required: true },
  analiseTecnica: { type: String, required: true },
  metodoUtilizado: { type: String, required: true },
  destinatario: { type: String, required: true },
  materiaisUtilizados: { type: String, required: true },
  examesRealizados: { type: String, required: true },
  consideracoesTecnicoPericiais: { type: String, required: true },
  conclusaoTecnica: { type: String, required: true },
  caso: {
    type: Schema.Types.ObjectId,
    ref: "Case",
    required: true,
  },
  evidencias: [{ type: Schema.Types.ObjectId, ref: "Evidence" }],
  criadoEm: {
    type: Date,
    default: Date.now,
  },
  assinadoDigitalmente: {
    type: Boolean,
    default: false,
  },
});

export const Report = mongoose.model<IReport>("Report", ReportSchema);
export { IReport };