import mongoose, { Document, Schema } from "mongoose";

interface IReport extends Document {
  titulo: string;
  conteudo: string;
  peritoResponsavel: mongoose.Types.ObjectId;
  casoRelacionado: mongoose.Types.ObjectId;
  dataCriacao: Date;
  assinaturaDigital(): void;
  exportarPDF(): void;
}

const ReportSchema: Schema = new mongoose.Schema({
  titulo: { type: String, required: true },
  conteudo: { type: String, required: true },
  peritoResponsavel: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  casoRelacionado: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
  dataCriacao: { type: Date, default: Date.now },
});

const Report = mongoose.model<IReport>("Report", ReportSchema);
export { Report, IReport };