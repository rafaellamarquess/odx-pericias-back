import { Request, Response, NextFunction } from "express";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel";

export const DashboardController = {
  async filtrarCasos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ano, mes } = req.query;
      const matchStage: any = {};

      if (ano && typeof ano === "string") {
        const anoNum = Number(ano);
        if (isNaN(anoNum) || anoNum < 1900 || anoNum > new Date().getFullYear()) {
          res.status(400).json({ error: "Parâmetro 'ano' inválido. Use o formato YYYY (ex.: 2025)." });
          return;
        }
        matchStage["caso.dataCriacao"] = {
          $gte: new Date(anoNum, 0, 1),
          $lte: new Date(anoNum, 11, 31, 23, 59, 59, 999),
        };
      }

      if (mes && typeof mes === "string") {
        const mesNum = Number(mes);
        if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
          res.status(400).json({ error: "Parâmetro 'mes' inválido. Use o formato MM (ex.: 05)." });
          return;
        }
        if (!ano) {
          res.status(400).json({ error: "O parâmetro 'ano' é obrigatório quando 'mes' é fornecido." });
          return;
        }
        const anoNum = Number(ano);
        matchStage["caso.dataCriacao"] = {
          $gte: new Date(anoNum, mesNum - 1, 1),
          $lte: new Date(anoNum, mesNum, 0, 23, 59, 59, 999),
        };
      }

      console.log("Filtros aplicados:", matchStage);

      const basePipeline = [
        {
          $lookup: {
            from: "cases",
            localField: "caso",
            foreignField: "_id",
            as: "caso",
          },
        },
        {
          $unwind: {
            path: "$caso",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $match: matchStage,
        },
      ];

      const documentosFiltrados = await Evidence.aggregate([...basePipeline]);
      console.log(
        "Documentos após o filtro:",
        documentosFiltrados.map(doc => ({
          casoId: doc.caso._id,
          cidade: doc.caso.cidade,
          dataCriacao: doc.caso.dataCriacao,
          vitimaId: doc.vitima,
        }))
      );

      const totalCasosPromise = Evidence.aggregate([
        ...basePipeline,
        { $count: "total" },
      ]);

      const casosPorMesPromise = Evidence.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: {
              ano: { $year: "$caso.dataCriacao" },
              mes: { $month: "$caso.dataCriacao" },
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
                {
                  $toString: {
                    $cond: [
                      { $lt: ["$_id.mes", 10] },
                      { $concat: ["0", { $toString: "$_id.mes" }] },
                      { $toString: "$_id.mes" },
                    ],
                  },
                },
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

      const vitimaPipeline = [
        ...basePipeline,
        {
          $lookup: {
            from: "vitimas",
            localField: "vitima",
            foreignField: "_id",
            as: "vitimaData",
          },
        },
        {
          $unwind: {
            path: "$vitimaData",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$vitimaData.identificada",
            quantidade: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            categoria: {
              $cond: [
                { $eq: ["$_id", true] },
                "Identificada",
                "Não Identificada",
              ],
            },
            quantidade: 1,
            tipoGrafico: "pizza",
          },
        },
        { $sort: { quantidade: -1 as 1 | -1 } },
      ];

      const [totalCasosResult, casosPorMes, vitima, sexo, estado, lesoes, cidade] = await Promise.all([
        totalCasosPromise,
        casosPorMesPromise,
        Evidence.aggregate(vitimaPipeline),
        Evidence.aggregate(criarAgrupamento("sexo", "evidence", "pizza")),
        Evidence.aggregate(criarAgrupamento("estadoCorpo", "evidence", "barra")),
        Evidence.aggregate(criarAgrupamento("lesoes", "evidence", "barra")),
        Evidence.aggregate(criarAgrupamento("cidade", "caso", "barra")),
      ]);

      const totalCasos = totalCasosResult[0]?.total || 0;

      console.log("Dados de vítima agregados:", vitima);
      console.log("Dados de cidade agregados:", cidade);

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
      res.status(500).json({ error: "Erro interno no servidor" });
      return;
    }
  },
};