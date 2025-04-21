import { Request, Response, NextFunction } from "express";
import { Evidence } from "../models/EvidenceModel";

export const DashboardController = {

  
  async filtrarCasos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Pipeline base para incluir dados de Case
      const basePipeline = [
        {
          $lookup: {
            from: "cases",
            localField: "casoReferencia",
            foreignField: "casoReferencia",
            as: "caso",
          },
        },
        {
          $unwind: "$caso",
        },
      ];

      const totalCasosPromise = Evidence.aggregate([
        ...basePipeline,
        { $count: "total" }
      ]);

      const criarAgrupamento = (campo: string, origem: "evidence" | "caso") => [
        ...basePipeline,
        {
          $group: {
            _id: origem === "evidence" ? `$${campo}` : `$caso.${campo}`,
            quantidade: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            categoria: { $ifNull: ["$_id", "Não Informado"] },
            quantidade: 1,
          },
        },
        { $sort: { quantidade: -1 as 1 | -1 } },
      ];

      const [totalCasosResult, vitima, sexo, estado, lesoes, cidade] = await Promise.all([
        totalCasosPromise,
        Evidence.aggregate(criarAgrupamento("vitima", "evidence")),
        Evidence.aggregate(criarAgrupamento("sexo", "evidence")),
        Evidence.aggregate(criarAgrupamento("estado", "caso")),
        Evidence.aggregate(criarAgrupamento("lesoes", "evidence")),
        Evidence.aggregate(criarAgrupamento("cidade", "caso")),
      ]);

      const totalCasos = totalCasosResult[0]?.total || 0;

      res.status(200).json({
        totalCasos,
        vitima,
        sexo,
        estado,
        lesoes,
        cidade,
      });
    } catch (err) {
      console.error("Erro ao gerar dados de dashboard:", err);
      next(err);
    }
  },
};
