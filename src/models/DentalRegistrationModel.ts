import { Schema, model, Types } from "mongoose";

const RegistroDentarioSchema = new Schema({
  paciente: { type: Types.ObjectId, ref: "Paciente", required: true },
  categoria: { type: String, required: true }, // ex: "Radiografia Panorâmica"
  tipoExame: { type: String, required: true }, // ex: "RX", "Tomografia"
  dataExame: { type: Date, required: true },
  observacoes: { type: String },
  imagemUrl: { type: String, required: true },
}, { timestamps: true });

export const RegistroDentario = model("RegistroDentario", RegistroDentarioSchema);