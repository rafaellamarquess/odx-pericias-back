import mongoose, { Document, Schema } from "mongoose";


interface ICase extends mongoose.Document {
  titulo: string;
  descricao: string;
  status: string;
  responsavel: mongoose.Types.ObjectId; // Deve ser ObjectId
  evidencias: Array<any>;
  dataCriacao: Date;
}

const CaseSchema = new mongoose.Schema<ICase>({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  status: { type: String, enum: ["Em andamento", "Finalizado", "Arquivado"], required: true },
  responsavel: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", // Referência ao modelo User
      required: true 
  },
  evidencias: [/* ... */],
  dataCriacao: { type: Date, default: Date.now }
});
export const Case = mongoose.model<ICase>("Case", CaseSchema);
