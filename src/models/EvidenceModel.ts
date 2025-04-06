import mongoose, { Document, Schema } from "mongoose";

interface IEvidence extends Document {
  tipo: string;
  dataColeta: Date;
  coletadoPor: mongoose.Types.ObjectId;
  upload(): void;
}

const EvidenceSchema: Schema = new mongoose.Schema ({
  tipo: { type: String, required: true },
  dataColeta: { type: Date, required: true },
  coletadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

// Método upload Exemplo do Chat
EvidenceSchema.methods.upload = function (): void {
  console.log(`Evidência do tipo ${this.tipo} foi enviada.`);
};

const Evidence = mongoose.model<IEvidence>("Evidence", EvidenceSchema);
export { Evidence, IEvidence };