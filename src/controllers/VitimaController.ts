import { NextFunction, Response, Request } from "express";
import { Vitima } from "../models/VitimaModel";

export const VitimaController = {
  async listVitimas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vitimas = await Vitima.find().sort({ nome: 1 });
      res.status(200).json({ vitimas });
    } catch (err) {
      next(err);
    }
  },
};