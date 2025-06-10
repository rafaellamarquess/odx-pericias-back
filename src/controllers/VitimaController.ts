import { Request, Response, NextFunction } from "express";
import { Vitima } from "../models/VitimaModel";
import mongoose from "mongoose";

export const VitimaController = {
  
  async listVitimas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vitimas = await Vitima.find().sort({ nome: 1 }).lean();
      res.status(200).json({ data: vitimas });
    } catch (err) {
      next(err);
    }
  },

  async getVitimaById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { populate } = req.query;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ msg: "ID da vítima inválido." });
        return;
      }
  
      let query = Vitima.findById(id);
      if (populate && typeof populate === "string") {
        const populations = populate.split(",").map((p) => p.trim());
        populations.forEach((p) => {
          if (["caso"].includes(p)) {
            query = query.populate(p, "titulo casoReferencia");
          }
        });
      }
  
      const vitima = await query;
      if (!vitima) {
        res.status(404).json({ msg: "Vítima não encontrada." });
        return;
      }
  
      res.status(200).json({ msg: "Vítima encontrada.", data: vitima });
    } catch (err) {
      console.error("Erro em getVitimaById:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },
};