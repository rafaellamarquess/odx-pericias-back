import mongoose, { Schema, Document } from "mongoose";

export interface IEvidence extends Document {
  tipo: string;
  dataColeta: Date;
  coletadoPor: mongoose.Types.ObjectId;
  url?: string;
  upload(): void;
}

const EvidenceSchema = new Schema<IEvidence>({
  tipo: { type: String, required: true },
  dataColeta: { type: Date, required: true },
  coletadoPor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  url: { type: String },
}, { discriminatorKey: 'evidenceType', timestamps: true });

EvidenceSchema.methods.upload = function (): void {
  console.log(`Evidência do tipo ${this.tipo} foi enviada.`);
};

const Evidence = mongoose.model<IEvidence>("Evidence", EvidenceSchema);
export { Evidence };