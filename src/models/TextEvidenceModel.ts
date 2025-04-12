import { Evidence } from "./EvidenceModel";
import { Document, Schema } from "mongoose";

export interface ITextEvidence extends Document {
  conteudo: string;
}

const TextEvidenceSchema = new Schema<ITextEvidence>({
  conteudo: { type: String, required: true }
});


const TextEvidence = Evidence.discriminator<ITextEvidence>("TextEvidence", TextEvidenceSchema);
export { TextEvidence };
