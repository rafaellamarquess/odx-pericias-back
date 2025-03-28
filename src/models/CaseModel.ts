import mongoose, { Document, Schema } from "mongoose";

interface ICase extends Document {
  titulo: string;
  descricao: string;
  status: string;
  evidencias: Array<any>;
  responsavel: mongoose.Types.ObjectId;
  dataCriacao: Date;
}

const CaseSchema: Schema = new Schema({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  status: { type: String, required: true, enum: ["Em andamento", "Finalizado", "Arquivado"] },
  evidencias: [
    {
      tipo: { type: String, required: true },
      descricao: { type: String, required: true },
      dataUpload: { type: Date, default: Date.now },
    },
  ],
  responsavel: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dataCriacao: { type: Date, default: Date.now },
});

const Case = mongoose.model<ICase>("Case", CaseSchema);
export { Case };
