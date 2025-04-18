import { Request, Response, NextFunction } from "express";
import { Case } from "../models/CaseModel";
import { CustomRequest } from "../types/CustomRequest";
import mongoose from "mongoose";
import { User } from "../models/UserModel";

export const CaseController = {

  // Criar novo caso
async createCase(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ msg: "Usuário não autenticado." });
      return;
    }

    if (user.perfil !== "Admin" && user.perfil !== "Perito") {
      res.status(403).json({ msg: "Apenas usuários com perfil 'Admin' ou 'Perito' podem cadastrar casos." });
      return;
    }

    const { titulo, descricao, responsavel, dataCriacao, casoReferencia } = req.body;

    if (!titulo || !descricao || !responsavel || !dataCriacao || !casoReferencia) {
      res.status(400).json({ msg: "Todos os campos são obrigatórios: título, descrição, responsável, data de criação e código de referência." });
      return;
    }

    // Busca o usuário pelo nome do responsável
    const responsavelUser = await User.findOne({ nome: responsavel }).select("nome _id");

    if (!responsavelUser) {
      res.status(404).json({ msg: "Responsável não encontrado." });
      return;
    }

    const parsedDate = new Date(dataCriacao);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ msg: "Data de criação inválida." });
      return;
    }

    const newCase = new Case({
      titulo,
      descricao,
      responsavel: responsavelUser._id, // ID do responsável
      responsavelNome: responsavelUser.nome, // Nome do responsável
      dataCriacao: parsedDate,
      casoReferencia,
      status: "Em andamento",
    });

    await newCase.save();
    res.status(201).json({ msg: "Caso cadastrado com sucesso!", caso: newCase });

  } catch (err) {
    next(err);
  }
},  

// Listar apenas os títulos dos casos (para dropdown)
async getCaseTitle(req: Request, res: Response, next: NextFunction) {
  try {
    const titulos = await Case.find({}, "titulo casoReferencia"); // Busca 'titulo' e 'casoReferencia'
    res.status(200).json(titulos);
  } catch (err) {
    next(err);
  }
},


  // Editar Caso
  async updateCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = req.params;
      const allowedFields = [
        "titulo",
        "descricao",
        "status",
        "dataInicio",
        "dataFim",
        "categoria",
        "observacoes",
        "casoReferencia" 
      ];
      const updateFields: any = {};
  
      // Somente os campos permitidos serão atualizados
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });
  
      const casoAtualizado = await Case.findByIdAndUpdate(caseId, updateFields, { new: true });
  
      if (!casoAtualizado) {
        res.status(404).json({ msg: "Caso não encontrado." });
        return;
      }
  
      res.status(200).json({ msg: "Caso atualizado com sucesso.", caso: casoAtualizado });
    } catch (err) {
      next(err);
    }
  },

  // Deletar Caso
  async deleteCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = req.params;

      const casoDeletado = await Case.findByIdAndDelete(caseId);

      if (!casoDeletado) {
        res.status(404).json({ msg: "Caso não encontrado." });
        return;
      }

      res.status(200).json({ msg: `Caso "${casoDeletado.titulo}" deletado com sucesso.` });
    } catch (err) {
      next(err);
    }
  },

  // Listar todos os casos e filtros  
  async listCases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        search,
        dataInicio,
        dataFim,
        status,
        responsavel,
        casoReferencia,
        page = "1",
        limit = "10"
      } = req.query;
  
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
  
      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ msg: "Número da página inválido" });
      }
  
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ msg: "Limite por página deve ser entre 1 e 100" });
      }
  
      const filtros: any = {};
  
      if (search) {
        if ((search as string).length < 3) {
          res.status(400).json({ msg: "O termo de busca deve ter pelo menos 3 caracteres" });
        }
        filtros.$or = [
          { titulo: { $regex: search as string, $options: "i" } },
          { descricao: { $regex: search as string, $options: "i" } }
        ];
      }

      if (casoReferencia) {
        filtros.casoReferencia = casoReferencia;
      }
  
      if (dataInicio || dataFim) {
        filtros.dataCriacao = {};
        if (dataInicio) {
          const inicio = new Date(dataInicio as string);
          if (isNaN(inicio.getTime())) {
            res.status(400).json({ msg: "Data de início inválida" });
          }
          filtros.dataCriacao.$gte = inicio;
        }
        if (dataFim) {
          const fim = new Date(dataFim as string);
          if (isNaN(fim.getTime())) {
            res.status(400).json({ msg: "Data de fim inválida" });
          }
          filtros.dataCriacao.$lte = fim;
        }
      }
  
      if (status) {
        const statusValidos = ["Em andamento", "Finalizado", "Arquivado"];
        if (!statusValidos.includes(status as string)) {
          res.status(400).json({ msg: "Status inválido", opcoes: statusValidos });
        }
        filtros.status = status;
      }
  
      if (responsavel) {
        if (!mongoose.Types.ObjectId.isValid(responsavel as string)) {
          res.status(400).json({ msg: "ID do responsável inválido" });
        }
        filtros.responsavel = new mongoose.Types.ObjectId(responsavel as string);
      }
  
      const [casos, total] = await Promise.all([
        Case.find(filtros)
          .populate("responsavel", "nome email")
          .sort({ dataCriacao: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Case.countDocuments(filtros)
      ]);
  
      res.status(200).json({
        msg: "Casos listados com sucesso",
        casos,
        paginacao: {
          total,
          paginaAtual: pageNum,
          porPagina: limitNum,
          totalPaginas: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
