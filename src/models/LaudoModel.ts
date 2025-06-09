import mongoose, { Document, Schema, Types } from "mongoose";
import { IEvidence } from "./EvidenceModel";
import { IVitima } from "./VitimaModel";
import { IUser } from "./UserModel";
import { ICase } from "./CaseModel";

interface ILaudo extends Document {
  dadosAntemortem: string;
  dadosPostmortem: string;
  analiseLesoes: string;
  conclusao: string;
  dataCriacao: Date;
  assinaturaDigital: string | null;
  perito: Types.ObjectId | IUser;
  caso: Types.ObjectId | ICase;
  evidencias: Types.Array<Types.ObjectId> | IEvidence[];
  vitima: Types.ObjectId | IVitima;
}

const LaudoSchema = new Schema<ILaudo>({
  evidencias: [{ type: Schema.Types.ObjectId, ref: "Evidence" }],
  caso: { type: Schema.Types.ObjectId, ref: "Case", required: true },
  vitima: { type: Schema.Types.ObjectId, ref: "Vitima", required: true },
  perito: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dadosAntemortem: { type: String, required: true },
  dadosPostmortem: { type: String, required: true },
  analiseLesoes: { type: String, required: true },
  conclusao: { type: String, required: true },
  assinaturaDigital: { type: String, default: null },
  dataCriacao: { type: Date, default: Date.now },
});

const Laudo = mongoose.model<ILaudo>("Laudo", LaudoSchema);
export { Laudo, ILaudo };