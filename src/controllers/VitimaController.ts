import { Request, Response, NextFunction } from "express";
import { Vitima, IVitima } from "../models/VitimaModel";

export const VitimaController = {
  async listVitimas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vitimas = await Vitima.find().sort({ nome: 1 }).lean();
      res.status(200).json({ data: vitimas });
    } catch (err) {
      next(err);
    }
  },
};