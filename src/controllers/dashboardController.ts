// import { Request, Response, NextFunction } from "express";
// import mongoose from "mongoose";
// import { Case } from "../models/CaseModel";


// export const dashboardController = {

//   // Buscar casos com texto e filtros
//   async buscarCasos(req: Request, res: Response, next: NextFunction) {
//     try {
//       const {
//         search,
//         dataInicio,
//         dataFim,
//         status,
//         responsavel,
//         page = "1",
//         limit = "10"
//       } = req.query;

//       if (!search) {
//         return res.status(400).json({ msg: "Parâmetro de busca 'search' é obrigatório" });
//       }

//       const pageNum = parseInt(page as string, 10);
//       const limitNum = parseInt(limit as string, 10);

//       if (isNaN(pageNum) || pageNum < 1) {
//         return res.status(400).json({ msg: "Número da página inválido" });
//       }

//       if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
//         return res.status(400).json({ msg: "Limite por página deve ser entre 1 e 100" });
//       }

//       const searchTerm = search as string;
//       if (searchTerm.length < 3) {
//         return res.status(400).json({ msg: "O termo de busca deve ter pelo menos 3 caracteres" });
//       }

//       const filtros: any = {
//         $or: [
//           { titulo: { $regex: searchTerm, $options: "i" } },
//           { descricao: { $regex: searchTerm, $options: "i" } }
//         ]
//       };

//       if (dataInicio || dataFim) {
//         filtros.dataCriacao = {};
//         if (dataInicio) {
//           const inicio = new Date(dataInicio as string);
//           if (isNaN(inicio.getTime())) {
//             return res.status(400).json({ msg: "Data de início inválida" });
//           }
//           filtros.dataCriacao.$gte = inicio;
//         }
//         if (dataFim) {
//           const fim = new Date(dataFim as string);
//           if (isNaN(fim.getTime())) {
//             return res.status(400).json({ msg: "Data de fim inválida" });
//           }
//           filtros.dataCriacao.$lte = fim;
//         }
//       }

//       if (status) {
//         const statusValidos = ["Em andamento", "Finalizado", "Arquivado"];
//         if (!statusValidos.includes(status as string)) {
//           return res.status(400).json({ msg: "Status inválido", opcoes: statusValidos });
//         }
//         filtros.status = status;
//       }

//       if (responsavel) {
//         if (!mongoose.Types.ObjectId.isValid(responsavel as string)) {
//           return res.status(400).json({ msg: "ID do responsável inválido" });
//         }
//         filtros.responsavel = new mongoose.Types.ObjectId(responsavel as string);
//       }

//       const [casos, total] = await Promise.all([
//         Case.find(filtros)
//           .populate("responsavel", "nome email")
//           .sort({ dataCriacao: -1 })
//           .skip((pageNum - 1) * limitNum)
//           .limit(limitNum),
//         Case.countDocuments(filtros)
//       ]);

//       res.status(200).json({
//         msg: "Casos encontrados com sucesso",
//         casos,
//         paginacao: {
//           total,
//           paginaAtual: pageNum,
//           porPagina: limitNum,
//           totalPaginas: Math.ceil(total / limitNum)
//         }
//       });
//     } catch (err) {
//       next(err);
//     }
//   },

//     // Listar casos com filtros e paginação
//     async listarCasos (req: Request, res: Response, next: NextFunction) {
//       try {
//         const { dataInicio, dataFim, status, responsavel, page = "1", limit = "10" } = req.query;
  
//         const pageNum = parseInt(page as string, 10);
//         const limitNum = parseInt(limit as string, 10);
  
//         if (isNaN(pageNum) || pageNum < 1) {
//           res.status(400).json({ msg: "Número da página inválido" });
//           return;
//         }
  
//         if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
//           res.status(400).json({ msg: "Limite por página deve ser entre 1 e 100" });
//           return;
//         }
  
//         const filtros: any = {};
  
//         if (dataInicio || dataFim) {
//           filtros.dataCriacao = {};
//           if (dataInicio) {
//             const inicio = new Date(dataInicio as string);
//             if (isNaN(inicio.getTime())) {
//               res.status(400).json({ msg: "Data de início inválida" });
//               return;
//             }
//             filtros.dataCriacao.$gte = inicio;
//           }
//           if (dataFim) {
//             const fim = new Date(dataFim as string);
//             if (isNaN(fim.getTime())) {
//               res.status(400).json({ msg: "Data de fim inválida" });
//               return;
//             }
//             filtros.dataCriacao.$lte = fim;
//           }
//         }
  
//         if (status) {
//           const statusValidos = ["Em andamento", "Finalizado", "Arquivado"];
//           if (!statusValidos.includes(status as string)) {
//             res.status(400).json({ msg: "Status inválido", opcoes: statusValidos });
//             return;
//           }
//           filtros.status = status;
//         }
  
//         if (responsavel) {
//           if (!mongoose.Types.ObjectId.isValid(responsavel as string)) {
//             res.status(400).json({ msg: "ID do responsável inválido" });
//             return;
//           }
//           filtros.responsavel = new mongoose.Types.ObjectId(responsavel as string);
//         }
  
//         const [casos, total] = await Promise.all([
//           Case.find(filtros)
//             .populate("responsavel", "nome email")
//             .sort({ dataCriacao: -1 })
//             .skip((pageNum - 1) * limitNum)
//             .limit(limitNum),
//           Case.countDocuments(filtros),
//         ]);
  
//         res.status(200).json({
//           msg: "Casos listados com sucesso",
//           casos,
//           paginacao: {
//             total,
//             paginaAtual: pageNum,
//             porPagina: limitNum,
//             totalPaginas: Math.ceil(total / limitNum),
//           },
//         });
//       } catch (err) {
//         next(err);
//       }
//     },

//   // Visualizar detalhes de um caso
// //   async visualizarCaso(req: Request, res: Response, next: NextFunction) {
// //     try {
// //       const { caseId } = req.params;

// //       if (!mongoose.Types.ObjectId.isValid(caseId)) {
// //         return res.status(400).json({ msg: "ID do caso inválido" });
// //       }

// //       const caso = await Case.findById(caseId).populate("responsavel", "nome email");

// //       if (!caso) {
// //         return res.status(404).json({ msg: "Caso não encontrado" });
// //       }

// //       res.status(200).json({
// //         msg: "Caso encontrado com sucesso",
// //         caso
// //       });
// //     } catch (err) {
// //       next(err);
// //     }
// //   }

// };
