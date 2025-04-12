import { Evidence } from "./EvidenceModel";
import { Document, Schema } from "mongoose";

export interface IImageEvidence extends Document {
  imagemURL: string;

}

const ImageEvidenceSchema = new Schema<IImageEvidence>({
  imagemURL: { type: String, required: true }
});


const ImageEvidence = Evidence.discriminator<IImageEvidence>("ImageEvidence", ImageEvidenceSchema);
export { ImageEvidence };