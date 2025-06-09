import mongoose, { Document, Schema, Types } from "mongoose";
import { ICase } from "./CaseModel";
import { IEvidence } from "./EvidenceModel";
import { IVitima } from "./VitimaModel";
import { ILaudo } from "./LaudoModel";

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
  audioURL?: string; 
  criadoEm: Date;
  assinadoDigitalmente: boolean;
  caso: Types.ObjectId | ICase;
  evidencias: Types.Array<Types.ObjectId> | IEvidence[];
  vitimas: Types.Array<Types.ObjectId> | IVitima[];
  laudos: Types.Array<Types.ObjectId> | ILaudo[];
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
  audioURL: { type: String }, criadoEm: { type: Date, default: Date.now,}, assinadoDigitalmente: { type: Boolean, default: false },
  caso: {
    type: Schema.Types.ObjectId,
    ref: "Case",
  },
  evidencias: [
    {
      type: Schema.Types.ObjectId,
      ref: "Evidence",
    },
  ],
  vitimas: [
    {
      type: Schema.Types.ObjectId,
      ref: "Vitima",
    },
  ],
  laudos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Laudo",
    },
  ],
});

export const Report = mongoose.model<IReport>("Report", ReportSchema);
export { IReport };