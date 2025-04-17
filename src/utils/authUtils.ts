import jwt from "jsonwebtoken";
import User from "../models/UserModel";
import { IUser } from "../models/UserModel";

interface DecodedToken {
  id: string;
  perfil: string;
}

export const getUserFromToken = async (authorization?: string): Promise<IUser> => {
  if (!authorization) throw { status: 401, msg: "Token não fornecido. Acesso negado." };

  const token = authorization.split(" ")[1];
  if (!process.env.JWT_SECRET) throw { status: 500, msg: "Erro no servidor. JWT_SECRET não configurado." };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.id);
    if (!user) throw { status: 401, msg: "Usuário não encontrado." };
    return user;
  } catch (err) {
    throw { status: 401, msg: "Token inválido ou expirado." };
  }
};
