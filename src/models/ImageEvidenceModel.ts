import { Evidence } from "./EvidenceModel";
import { Document, Schema } from "mongoose";

export interface IImageEvidence extends Document {
  imagemURL: string;
  processarImagem(): void;
}

const ImageEvidenceSchema = new Schema<IImageEvidence>({
  imagemURL: { type: String, required: true }
});

ImageEvidenceSchema.methods.processarImagem = function (): void {
  console.log(`Imagem em ${this.imagemURL} foi processada.`);
};

const ImageEvidence = Evidence.discriminator<IImageEvidence>("ImageEvidence", ImageEvidenceSchema);
export { ImageEvidence };