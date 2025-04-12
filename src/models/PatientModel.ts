import { Schema, model, Types } from "mongoose";

const PacienteSchema = new Schema({
  nome: { type: String }, // apenas se identificado
  identificado: { type: Boolean, required: true },
  sexo: { type: String, enum: ["masculino", "feminino", "outro"], required: true },
  dataNascimento: { type: Date },   // apenas se identificado
}, { timestamps: true });

export const Paciente = model("Paciente", PacienteSchema);