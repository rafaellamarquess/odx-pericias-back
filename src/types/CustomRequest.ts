import { Request } from "express";
import { IUser } from "../models/UserModel"; 

export interface CustomRequest extends Request {
  user?: IUser;
}

