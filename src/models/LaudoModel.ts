import mongoose, { Document, Schema, Types } from "mongoose";
import { IEvidence } from "./EvidenceModel";
import { IUser } from "./UserModel";

interface ILaudo extends Document {
  evidencias: Types.Array<Types.ObjectId> | IEvidence[];
  perito: Types.ObjectId | IUser;
  dadosAntemortem: string;
  dadosPostmortem: string;
  analiseLesoes: string;
  conclusao: string;
  dataCriacao: Date;
  assinaturaDigital?: string;
}

const LaudoSchema = new Schema<ILaudo>({
  evidencias: [
    {
      type: Schema.Types.ObjectId,
      ref: "Evidence",
      required: true,
    },
  ],
  perito: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dadosAntemortem: { type: String, required: true },
  dadosPostmortem: { type: String, required: true },
  analiseLesoes: { type: String, required: true },
  conclusao: { type: String, required: true },
  dataCriacao: { type: Date, default: Date.now },
  assinaturaDigital: { type: String },
});

const Laudo = mongoose.model<ILaudo>("Laudo", LaudoSchema);
export { Laudo, ILaudo };
