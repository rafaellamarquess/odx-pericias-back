import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  perfil: { type: String, enum: ["Admin", "Perito", "Assistente"], required: true },
}, { timestamps: true });

// Hash da senha antes de salvar no banco
UserSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

export default mongoose.model("User", UserSchema);
