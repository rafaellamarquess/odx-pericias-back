import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Case } from "../models/CaseModel";

export const peritoController = {
  // Cadastrar um novo caso
  cadastrarCaso: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { titulo, descricao, responsavel } = req.body;
      const novoCaso = new Case({
        titulo,
        descricao,
        status: "Em andamento", // Status inicial
        responsavel, // No caso é o nome do Perito que criou o caso
        evidencias: [],
      });
      await novoCaso.save();
      res.status(201).json({ msg: "Caso cadastrado com sucesso!", caso: novoCaso });
    } catch (err) {
      next(err);
    }
  },

  // Analisar evidências de um caso
  analisarEvidencias: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { caseId, evidencias } = req.body;
      const caso = await Case.findById(caseId);

      if (!caso) {
         res.status(404).json({ msg: "Caso não encontrado" });
         return;
      }
      caso.evidencias = evidencias;
      await caso.save();
      res.status(200).json({ msg: "Evidências analisadas com sucesso", caso });
    } catch (err) {
      next(err);
    }
  },

  // Gerar laudo do caso
  gerarLaudo: async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try {
      const { caseId } = req.params;
      const caso = await Case.findById(caseId);

      if (!caso) {
       res.status(404).json({ msg: "Caso não encontrado" });
      }

      // Lógica para gerar o laudo: processamento de evidências, geração de documentos, etc....
      res.status(200).json({ msg: "Laudo gerado com sucesso", caso });
    } catch (err) {
      next(err);
    }
  },

  // Listar casos com filtros (sem busca por texto)
  listarCasos: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dataInicio, dataFim, status, responsavel, page = "1", limit = "10" } = req.query;

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

      const filtros: any = {};

      if (dataInicio || dataFim) {
        filtros.dataCriacao = {};
        if (dataInicio) {
          const inicio = new Date(dataInicio as string);
          if (isNaN(inicio.getTime())) {
            res.status(400).json({ msg: "Data de início inválida" });
            return;
          }
          filtros.dataCriacao.$gte = inicio;
        }
        if (dataFim) {
          const fim = new Date(dataFim as string);
          if (isNaN(fim.getTime())) {
            res.status(400).json({ msg: "Data de fim inválida" });
            return;
          }
          filtros.dataCriacao.$lte = fim;
        }
      }

      if (status) {
        const statusValidos = ["Em andamento", "Finalizado", "Arquivado"];
        if (!statusValidos.includes(status as string)) {
          res.status(400).json({ msg: "Status inválido", opcoes: statusValidos });
          return;
        }
        filtros.status = status;
      }

      if (responsavel) {
        if (!mongoose.Types.ObjectId.isValid(responsavel as string)) {
          res.status(400).json({ msg: "ID do responsável inválido" });
          return;
        }
        filtros.responsavel = new mongoose.Types.ObjectId(responsavel as string);
      }

      const [casos, total] = await Promise.all([
        Case.find(filtros)
          .populate("responsavel", "nome email")
          .sort({ dataCriacao: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Case.countDocuments(filtros),
      ]);

      res.status(200).json({
        msg: "Casos listados com sucesso",
        casos,
        paginacao: {
          total,
          paginaAtual: pageNum,
          porPagina: limitNum,
          totalPaginas: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // Buscar casos por texto (com filtros adicionais)
  buscarCasos: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, dataInicio, dataFim, status, responsavel, page = "1", limit = "10" } = req.query;

      if (!search) {
        res.status(400).json({ msg: "Parâmetro de busca 'search' é obrigatório" });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ msg: "Número da página inválido" 
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ msg: "Limite por página deve ser entre 1 e 100" });
        return;
      }

      const searchTerm = search as string;
      if (searchTerm.length < 3) {
        res.status(400).json({ msg: "O termo de busca deve ter pelo menos 3 caracteres" });
        return;
      }

      const filtros: any = {
        $or: [
          { titulo: { $regex: searchTerm, $options: "i" } },
          { descricao: { $regex: searchTerm, $options: "i" } },
        ],
      };

      if (dataInicio || dataFim) {
        filtros.dataCriacao = {};
        if (dataInicio) {
          const inicio = new Date(dataInicio as string);
          if (isNaN(inicio.getTime())) {
            res.status(400).json({ msg: "Data de início inválida" });
            return;
          }
          filtros.dataCriacao.$gte = inicio;
        }
        if (dataFim) {
          const fim = new Date(dataFim as string);
          if (isNaN(fim.getTime())) {
            res.status(400).json({ msg: "Data de fim inválida" });
            return;
          }
          filtros.dataCriacao.$lte = fim;
        }
      }

      if (status) {
        const statusValidos = ["Em andamento", "Finalizado", "Arquivado"];
        if (!statusValidos.includes(status as string)) {
          res.status(400).json({ msg: "Status inválido", opcoes: statusValidos });
          return;
        }
        filtros.status = status;
      }

      if (responsavel) {
        if (!mongoose.Types.ObjectId.isValid(responsavel as string)) {
          res.status(400).json({ msg: "ID do responsável inválido" });
          return;
        }
        filtros.responsavel = new mongoose.Types.ObjectId(responsavel as string);
      }

      const [casos, total] = await Promise.all([
        Case.find(filtros)
          .populate("responsavel", "nome email")
          .sort({ dataCriacao: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Case.countDocuments(filtros),
      ]);

      res.status(200).json({
        msg: "Casos encontrados com sucesso",
        casos,
        paginacao: {
          total,
          paginaAtual: pageNum,
          porPagina: limitNum,
          totalPaginas: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // Visualizar detalhes de um caso
  visualizarCaso: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { caseId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(caseId)) {
        res.status(400).json({ msg: "ID do caso inválido" });
        return;
      }

      const caso = await Case.findById(caseId).populate("responsavel", "nome email");

      if (!caso) {
        res.status(404).json({ msg: "Caso não encontrado" });
        return;
      }

      res.status(200).json({
        msg: "Caso encontrado com sucesso",
        caso: {
          id: caso._id,
          titulo: caso.titulo,
          descricao: caso.descricao,
          status: caso.status,
          responsavel: caso.responsavel,
          evidencias: caso.evidencias,
          dataCriacao: caso.dataCriacao,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};