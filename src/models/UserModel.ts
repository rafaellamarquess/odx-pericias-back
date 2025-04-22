import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export enum Perfil {
  ADMIN = "Admin",
  PERITO = "Perito",
  ASSISTENTE = "Assistente",
}

export interface IUser extends Document {
  nome: string;
  email: string;
  senha: string;
  perfil: "Admin" | "Perito" | "Assistente";
  rg: string;
  cro?: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    perfil: { type: String, enum: ["Admin", "Perito", "Assistente"], required: true },
    rg: { type: String, required: true },
    cro: {
      type: String,
      required: function (this: IUser) {
        return this.perfil === "Perito";
      },
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash da senha antes de salvar no banco
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("senha")) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

export const User = mongoose.model<IUser>("User", UserSchema);
export default User;