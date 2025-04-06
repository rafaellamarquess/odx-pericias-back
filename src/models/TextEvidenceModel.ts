import { Evidence } from "./EvidenceModel";
import { Document, Schema } from "mongoose";

export interface ITextEvidence extends Document {
  conteudo: string;
  analiseDeTexto(): void;
}

const TextEvidenceSchema = new Schema<ITextEvidence>({
  conteudo: { type: String, required: true }
});

TextEvidenceSchema.methods.analiseDeTexto = function (): void {
  console.log(`Texto analisado: ${this.conteudo.slice(0, 50)}...`);
};

const TextEvidence = Evidence.discriminator<ITextEvidence>("TextEvidence", TextEvidenceSchema);
export { TextEvidence };
