import { Request, Response, NextFunction } from "express";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel";

export const DashboardController = {
    
  async filtrarCasos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        vitima,
        sexo,
        estado,
        cidade,
        lesoes,
        page = "1",
        limit = "10",
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ msg: "Número da página inválido" });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ msg: "Limite por página deve ser entre 1 e 100" });
        return;
      }

      // Pipeline de agregação
      const pipeline: any[] = [
        // Juntar com os dados do Case baseado no campo casoReferencia
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
          $match: {
            ...(vitima && typeof vitima === "string" && { vitima: { $regex: vitima, $options: "i" } }),
            ...(sexo && typeof sexo === "string" && { sexo }),
            ...(lesoes && typeof lesoes === "string" && { lesoes: { $regex: lesoes, $options: "i" } }),
            ...(estado && typeof estado === "string" && { "caso.estado": estado }),
            ...(cidade && typeof cidade === "string" && { "caso.cidade": { $regex: cidade, $options: "i" } }),
          },
        },
        {
          $sort: { dataUpload: -1 },
        },
        {
          $skip: (pageNum - 1) * limitNum,
        },
        {
          $limit: limitNum,
        },
        {
          $project: {
            _id: 1,
            tipo: 1,
            categoria: 1,
            vitima: 1,
            sexo: 1,
            estadoCorpo: 1,
            lesoes: 1,
            coletadoPor: 1,
            imagemURL: 1,
            conteudo: 1,
            laudo: 1,
            dataUpload: 1,
            "caso.cidade": 1,
            "caso.estado": 1,
            "caso.titulo": 1,
            "caso._id": 1,
          },
        },
      ];

      const totalCountPipeline = [
        ...pipeline.slice(0, pipeline.findIndex(stage => stage.$skip !== undefined || stage.$limit !== undefined)),
        { $count: "total" },
      ];

      const [resultados, totalResult] = await Promise.all([
        Evidence.aggregate(pipeline),
        Evidence.aggregate(totalCountPipeline),
      ]);

      const total = totalResult[0]?.total || 0;

      res.status(200).json({
        msg: "Casos filtrados com sucesso",
        casos: resultados,
        paginacao: {
          total,
          paginaAtual: pageNum,
          porPagina: limitNum,
          totalPaginas: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      console.error("Erro ao filtrar casos:", err);
      next(err);
    }
  },
};