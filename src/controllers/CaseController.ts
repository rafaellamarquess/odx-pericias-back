import { Request, Response, NextFunction } from "express";
import { Case } from "../models/CaseModel";
import { CustomRequest } from "../types/CustomRequest";
import mongoose from "mongoose";
import { User } from "../models/UserModel";
import { Evidence } from "../models/EvidenceModel";


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

    const { titulo, descricao, responsavel, dataCriacao, casoReferencia, cidade, estado } = req.body;

    if (!titulo || !descricao || !responsavel || !dataCriacao || !casoReferencia || !cidade || !estado) {
      res.status(400).json({ msg: "Todos os campos são obrigatórios: título, descrição, responsável, data de criação, código de referência, cidade e estado." });
      return;
    }

    const responsavelUser = await User.findOne({ nome: responsavel }).select("nome _id");

    if (!responsavelUser) {
      res.status(404).json({ msg: "Responsável não encontrado." });
      return;
    }

    const parsedDate = new Date(dataCriacao);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ msg: "Data de criação inválida. Formato esperado: ISO 8601 (ex: 2025-04-19T12:00:00Z)." });
      return;
    }

    const existingCase = await Case.findOne({ casoReferencia: casoReferencia.trim() });
    if (existingCase) {
      res.status(409).json({ msg: "Já existe um caso com esse código de referência." });
      return;
    }

    const newCase = new Case({
      titulo,
      descricao,
      responsavel: responsavelUser._id,
      cidade,
      estado,
      dataCriacao: parsedDate,
      casoReferencia: casoReferencia.trim(), // remove espaços acidentais
      status: "Em andamento",
    });

    await newCase.save();
    res.status(201).json({ msg: "Caso cadastrado com sucesso!", caso: newCase });

  } catch (err) {
    console.error("Erro ao criar caso:", err);
    next(err);
  }
},

  getEvidencesByCaseId: async (req: Request, res: Response) => {
    try {
      const { caseId } = req.params;
      const evidencias = await Evidence.find({ caso: caseId });
      res.status(200).json({ evidencias });
    } catch (error) {
      console.error("Erro ao buscar evidências do caso:", error);
      res.status(500).json({ msg: "Erro ao buscar evidências do caso." });
    }
  },


  // Editar Caso
  async updateCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(caseId)) {
        res.status(400).json({ msg: "ID do caso inválido." });
        return;
      }
  
      const allowedFields = ["titulo", "descricao", "status", "cidade", "estado"];
      const updateFields: any = {};
  
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });
  
      const casoAtualizado = await Case.findByIdAndUpdate(caseId, updateFields, { new: true })
        .populate<{ responsavel: { nome: string } }>("responsavel", "nome"); // Adicionar population
  
      if (!casoAtualizado) {
        res.status(404).json({ msg: "Caso não encontrado." });
        return;
      }
  
      // Formatar a resposta para garantir consistência com listCases
      const casoFormatado = {
        _id: casoAtualizado._id,
        titulo: casoAtualizado.titulo,
        descricao: casoAtualizado.descricao,
        status: casoAtualizado.status,
        cidade: casoAtualizado.cidade,
        estado: casoAtualizado.estado,
        dataCriacao: casoAtualizado.dataCriacao,
        casoReferencia: casoAtualizado.casoReferencia,
        responsavel: casoAtualizado.responsavel ? casoAtualizado.responsavel.nome : null,
      };
  
      res.status(200).json({ msg: "Caso atualizado com sucesso.", caso: casoFormatado });
    } catch (err) {
      console.error("Erro ao atualizar caso:", err);
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

 // Listar Casos
 // Essa função agora aceita um novo parâmetro `somenteArray` que, se definido como "true", retorna apenas um array simples de casos sem paginação.
 // Se não for definido ou for "false", a paginação padrão é aplicada.
 // Aplica-se também a filtros de pesquisa, data, status, responsável, caso de referência, cidade e estado.
 async listCases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      search,
      dataInicio,
      dataFim,
      status,
      responsavel,
      casoReferencia,
      cidade,
      estado,
      page = "1",
      limit = "10",
      somenteArray // <-- Novo parâmetro
    } = req.query;

    const filtros: any = {};

    // Filtros diversos
    if (search) {
      if ((search as string).length < 3) {
        res.status(400).json({ msg: "O termo de busca deve ter pelo menos 3 caracteres" });
        return;
      }

      filtros.$or = [
        { titulo: { $regex: search as string, $options: "i" } },
        { descricao: { $regex: search as string, $options: "i" } }
      ];
    }

    if (casoReferencia) {
      filtros.casoReferencia = casoReferencia;
    }

    if (cidade) {
      filtros.cidade = { $regex: cidade as string, $options: "i" };
    }

    if (estado) {
      filtros.estado = { $regex: estado as string, $options: "i" };
    }

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

    // Se for solicitado apenas array simples (sem paginação)
    if (somenteArray === "true") {
      const casos = await Case.find(filtros)
        .populate<{ responsavel: { nome: string } }>("responsavel", "nome")
        .sort({ dataCriacao: -1 });

      const casosFormatados = casos.map(caso => {
        const obj = caso.toObject();
        return {
          _id: obj._id,
          titulo: obj.titulo,
          descricao: obj.descricao,
          status: obj.status,
          cidade: obj.cidade,
          estado: obj.estado,
          dataCriacao: obj.dataCriacao,
          casoReferencia: obj.casoReferencia,
          responsavel: typeof obj.responsavel === "object" ? obj.responsavel.nome : null
        };
      });

      res.status(200).json(casosFormatados);
      return;
    }

    // Paginação padrão
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

    const [casos, total] = await Promise.all([
      Case.find(filtros)
        .populate<{ responsavel: { nome: string } }>("responsavel", "nome")
        .sort({ dataCriacao: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Case.countDocuments(filtros)
    ]);

    const casosFormatados = casos.map(caso => {
      const obj = caso.toObject();
      return {
        _id: obj._id,
        titulo: obj.titulo,
        descricao: obj.descricao,
        status: obj.status,
        cidade: obj.cidade,
        estado: obj.estado,
        dataCriacao: obj.dataCriacao,
        casoReferencia: obj.casoReferencia,
        responsavel: typeof obj.responsavel === "object" ? obj.responsavel.nome : null
      };
    });

    res.status(200).json({
      msg: "Casos listados com sucesso",
      casos: casosFormatados,
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
