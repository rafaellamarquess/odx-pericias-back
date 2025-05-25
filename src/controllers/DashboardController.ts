import { Request, Response, NextFunction } from "express";
import { Evidence } from "../models/EvidenceModel";

export const DashboardController = {
  async filtrarCasos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mes, data } = req.query;
      const matchStage: any = {};

      if (mes && typeof mes === "string") {
        const [ano, mesNum] = mes.split("-").map(Number);
        matchStage["caso.data"] = {
          $exists: true,
          $gte: new Date(ano, mesNum - 1, 1),
          $lte: new Date(ano, mesNum, 0),
        };
      }

      if (data && typeof data === "string") {
        const dataInicio = new Date(data);
        const dataFim = new Date(data);
        dataFim.setHours(23, 59, 59, 999);
        matchStage["caso.data"] = {
          $exists: true,
          $gte: dataInicio,
          $lte: dataFim,
        };
      }

      console.log("Filtros aplicados:", matchStage);

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
        {
          $match: matchStage,
        },
      ];

      console.log("Documentos após o filtro:", await Evidence.aggregate([...basePipeline]));

      const totalCasosPromise = Evidence.aggregate([
        ...basePipeline,
        { $count: "total" },
      ]);

      const casosPorMesPromise = Evidence.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: {
              ano: { $year: "$caso.data" },
              mes: { $month: "$caso.data" },
            },
            quantidade: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            mes: {
              $concat: [
                { $toString: "$_id.ano" },
                "-",
                { $toString: { $cond: [{ $lt: ["$_id.mes", 10] }, { $concat: ["0", { $toString: "$_id.mes" }] }, { $toString: "$_id.mes" }] } },
              ],
            },
            quantidade: 1,
          },
        },
        { $sort: { mes: 1 } },
      ]).then(result => result || []);

      const criarAgrupamento = (campo: string, origem: "evidence" | "caso", tipoGrafico: string) => [
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
            tipoGrafico,
          },
        },
        { $sort: { quantidade: -1 as 1 | -1 } },
      ];

      const [totalCasosResult, casosPorMes, vitima, sexo, estado, lesoes, cidade] = await Promise.all([
        totalCasosPromise,
        casosPorMesPromise,
        Evidence.aggregate(criarAgrupamento("vitima", "evidence", "pizza")),
        Evidence.aggregate(criarAgrupamento("sexo", "evidence", "pizza")),
        Evidence.aggregate(criarAgrupamento("estadoCorpo", "evidence", "barra")),
        Evidence.aggregate(criarAgrupamento("lesoes", "evidence", "barra")),
        Evidence.aggregate(criarAgrupamento("cidade", "caso", "pizza")), // Alterado para 'pizza'
      ]);

      const totalCasos = totalCasosResult[0]?.total || 0;

      res.status(200).json({
        totalCasos,
        casosPorMes,
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