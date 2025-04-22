import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  objetoPericia: { type: String, required: true },
  analiseTecnica: { type: String, required: true },
  metodoUtilizado: { type: String, required: true },
  destinatario: { type: String, required: true },
  materiaisUtilizados: { type: String, required: true },
  examesRealizados: { type: String, required: true },
  consideracoesTecnicoPericiais: { type: String, required: true },
  conclusaoTecnica: { type: String, required: true },

  caso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
    required: true
  },
  
  evidencias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
  
  criadoEm: {
    type: Date,
    default: Date.now
  },
  assinadoDigitalmente: {
    type: Boolean,
    default: false
  }
});

export const Report = mongoose.model("Report", ReportSchema);
