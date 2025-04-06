import mongoose, { Document, Schema } from "mongoose";

interface IComparisonResult extends Document {
  resultado: string;
  precisao: number;
  analisadoPor: mongoose.Types.ObjectId;
  casoRelacionado: mongoose.Types.ObjectId;
  dataAnalise: Date;
  visualizarComparacao(): void;
}
const ComparisonResultSchema: Schema = new mongoose.Schema({
  resultado: { type: String, required: true },
  precisao: { type: Number, required: true },
  analisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  casoRelacionado: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
  dataAnalise: { type: Date, default: Date.now },
});

// Método Exemplo do Chat
ComparisonResultSchema.methods.visualizarComparacao = function (): void {
  console.log(
    `Resultado da comparação: ${this.resultado}, Precisão: ${this.precisao}%`
  );
};

const ComparisonResult = mongoose.model<IComparisonResult>(
  "ComparisonResult",
  ComparisonResultSchema
);
export { ComparisonResult, IComparisonResult };