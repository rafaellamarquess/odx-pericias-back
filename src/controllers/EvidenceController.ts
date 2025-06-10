import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { IEvidence, Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel";
import { Vitima } from "../models/VitimaModel";
import { User } from "../models/UserModel";

export const EvidenceController = {
  async createEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log("Requisição recebida:", { body: req.body, file: req.file }); // Log para depuração
  
      const { vitimaId, casoReferencia, tipo, categoria, coletadoPor, texto } = req.body;
      const camposObrigatorios = ["casoReferencia", "tipo", "categoria", "coletadoPor"];
      if (!vitimaId) {
        camposObrigatorios.push("sexo", "estadoCorpo");
      }
  
      for (const campo of camposObrigatorios) {
        if (!req.body[campo]) {
          res.status(400).json({ msg: `Campo obrigatório ausente: ${campo}` });
          return;
        }
      }
  
      const {
        nome,
        dataNascimento,
        idadeAproximada,
        nacionalidade,
        cidade,
        sexo,
        estadoCorpo,
        lesoes,
        identificada,
      } = req.body;
  
      const user = await User.findOne({ nome: coletadoPor });
      if (!user) {
        res.status(404).json({ msg: "Usuário coletor não encontrado pelo nome fornecido." });
        return;
      }
  
      const tiposValidos = ["imagem", "texto"];
      if (!tiposValidos.includes(tipo)) {
        res.status(400).json({ msg: "Tipo de evidência inválido. Use 'imagem' ou 'texto'." });
        return;
      }
  
      const foundCase = await Case.findOne({ casoReferencia }) as (typeof Case & { _id: mongoose.Types.ObjectId });
      if (!foundCase) {
        res.status(404).json({ msg: "Caso não encontrado com esse código de referência." });
        return;
      }
  
      let vitima;
      if (vitimaId) {
        vitima = await Vitima.findById(vitimaId);
        if (!vitima) {
          res.status(404).json({ msg: "Vítima não encontrada." });
          return;
        }
        // Se a vítima não tem caso associado, associá-la ao caso atual
        if (!vitima.caso) {
          vitima.caso = foundCase._id as mongoose.Types.ObjectId;
          await vitima.save();
          console.log(`Vítima ${vitimaId} associada ao caso ${foundCase._id}`);
        } else if (vitima.caso.toString() !== (foundCase._id as mongoose.Types.ObjectId).toString()) {
          console.log(`Conflito de caso: vítima ${vitimaId} associada a ${vitima.caso}, mas caso enviado é ${foundCase._id}`);
          res.status(400).json({ msg: "O caso selecionado não está associado à vítima." });
          return;
        }
      } else {
        vitima = await Vitima.create({
          nome,
          dataNascimento,
          idadeAproximada: idadeAproximada ? parseInt(idadeAproximada) : undefined,
          nacionalidade,
          cidade,
          sexo,
          estadoCorpo,
          lesoes,
          identificada: identificada === "true" || identificada === true,
          caso: foundCase._id,
        });
        console.log(`Nova vítima criada: ${vitima._id}`);
      }
  
      let novaEvidencia: IEvidence;
      if (tipo === "imagem") {
        if (!req.file || !req.file.path) {
          res.status(400).json({ msg: "Arquivo de imagem não enviado." });
          return;
        }
        novaEvidencia = await Evidence.create({
          caso: foundCase._id,
          vitima: vitima._id,
          tipo,
          categoria,
          coletadoPor: user._id,
          imagem: req.file.path,
        });
      } else {
        if (!texto) {
          res.status(400).json({ msg: "Texto obrigatório para evidência do tipo texto." });
          return;
        }
        novaEvidencia = await Evidence.create({
          caso: foundCase._id,
          vitima: vitima._id,
          tipo,
          categoria,
          coletadoPor: user._id,
          texto,
        });
      }
  
      await Case.updateOne({ _id: foundCase._id }, { $push: { evidencias: novaEvidencia._id } });
  
      const populatedEvidence = await Evidence.findById(novaEvidencia._id)
        .populate("vitima", "nome sexo estadoCorpo identificada cidade lesoes")
        .populate("coletadoPor", "nome")
        .populate("caso", "casoReferencia");
  
      res.status(201).json({
        msg: "Evidência cadastrada com sucesso.",
        evidence: populatedEvidence,
        vitima,
      });
    } catch (err) {
      console.error("Erro em createEvidence:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async updateEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { evidenceId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
        res.status(400).json({ msg: "ID da evidência inválido." });
        return;
      }
  
      const allowedEvidenceFields = ["casoReferencia", "tipo", "categoria", "coletadoPor", "texto"];
      const allowedVitimaFields = [
        "nome",
        "dataNascimento",
        "idadeAproximada",
        "nacionalidade",
        "cidade",
        "sexo",
        "estadoCorpo",
        "lesoes",
        "identificada",
      ];
  
      const evidenceUpdate: any = {};
      const vitimaUpdate: any = {};
      let casoId;
  
      // Validate required fields
      const requiredFields = ["casoReferencia", "tipo", "categoria", "coletadoPor"];
      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === "") {
          res.status(400).json({ msg: `Campo obrigatório ausente: ${field}` });
          return;
        }
      }
  
      // Process evidence fields
      for (const field of allowedEvidenceFields) {
        if (req.body[field] !== undefined) {
          evidenceUpdate[field] = req.body[field];
        }
      }
  
      // Handle casoReferencia
      if (req.body.casoReferencia) {
        const foundCase = await Case.findOne({ casoReferencia: req.body.casoReferencia });
        if (!foundCase) {
          res.status(404).json({ msg: "Caso não encontrado com esse código de referência." });
          return;
        }
        casoId = foundCase._id;
        evidenceUpdate.caso = casoId;
      }
  
      // Handle coletadoPor
      if (req.body.coletadoPor) {
        const user = await User.findOne({ nome: req.body.coletadoPor });
        if (!user) {
          res.status(404).json({ msg: "Usuário coletor não encontrado pelo nome fornecido." });
          return;
        }
        evidenceUpdate.coletadoPor = user._id;
      }
  
      // Handle image file
      if (req.file && req.file.path) {
        evidenceUpdate.imagem = req.file.path;
      }
  
      // Validate tipo and content
      const existingEvidence = await Evidence.findById(evidenceId);
      if (!existingEvidence) {
        res.status(404).json({ msg: "Evidência não encontrada." });
        return;
      }
  
      if (evidenceUpdate.tipo) {
        const tiposValidos = ["imagem", "texto"];
        if (!tiposValidos.includes(evidenceUpdate.tipo)) {
          res.status(400).json({ msg: "Tipo de evidência inválido. Use 'imagem' ou 'texto'." });
          return;
        }
        if (evidenceUpdate.tipo === "imagem" && !evidenceUpdate.imagem && !existingEvidence.imagem) {
          res.status(400).json({ msg: "Imagem obrigatória para evidência do tipo imagem." });
          return;
        }
        if (evidenceUpdate.tipo === "texto" && !evidenceUpdate.texto && !existingEvidence.texto) {
          res.status(400).json({ msg: "Texto obrigatório para evidência do tipo texto." });
          return;
        }
      }
  
      // Process victim fields
      let vitimaId = req.body.vitimaId;
      if (!vitimaId) {
        res.status(400).json({ msg: "ID da vítima é obrigatório para atualização." });
        return;
      }
  
      const existingVitima = await Vitima.findById(vitimaId);
      if (!existingVitima) {
        res.status(404).json({ msg: "Vítima não encontrada." });
        return;
      }
  
      for (const field of allowedVitimaFields) {
        if (req.body[field] !== undefined) {
          vitimaUpdate[field] = req.body[field];
        }
      }
  
      if (Object.keys(vitimaUpdate).length > 0) {
        vitimaUpdate.idadeAproximada = vitimaUpdate.idadeAproximada
          ? parseInt(vitimaUpdate.idadeAproximada)
          : undefined;
        vitimaUpdate.identificada = vitimaUpdate.identificada === "true" || vitimaUpdate.identificada === true;
        await Vitima.findByIdAndUpdate(vitimaId, vitimaUpdate, { new: true });
      }
  
      // Update evidence
      const updatedEvidence = await Evidence.findByIdAndUpdate(
        evidenceId,
        { ...evidenceUpdate, vitima: vitimaId, caso: casoId || existingEvidence.caso },
        { new: true }
      )
        .populate("coletadoPor", "nome")
        .populate("vitima", "nome sexo estadoCorpo identificada cidade lesoes")
        .populate("caso", "casoReferencia");
  
      if (!updatedEvidence) {
        res.status(404).json({ msg: "Falha ao atualizar a evidência." });
        return;
      }
  
      const updatedVitima = await Vitima.findById(vitimaId);
  
      res.status(200).json({
        msg: "Evidência atualizada com sucesso.",
        evidence: updatedEvidence,
        vitima: updatedVitima,
      });
    } catch (err) {
      console.error("Erro em updateEvidence:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async deleteEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { evidenceId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
        res.status(400).json({ msg: "ID da evidência inválido." });
        return;
      }

      const evidence = await Evidence.findById(evidenceId);
      if (!evidence) {
        res.status(404).json({ msg: "Evidência não encontrada." });
        return;
      }

      await Evidence.findByIdAndDelete(evidenceId);

      const otherEvidences = await Evidence.find({ vitima: evidence.vitima, _id: { $ne: evidenceId } });
      if (otherEvidences.length === 0) {
        await Vitima.findByIdAndDelete(evidence.vitima);
      }

      await Case.updateOne({ _id: evidence.caso }, { $pull: { evidencias: evidence._id } });

      res.status(200).json({ msg: "Evidência deletada com sucesso." });
    } catch (err) {
      console.error("Erro em deleteEvidence:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async listEvidences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        categoria,
        tipo,
        sexo,
        estadoCorpo,
        coletadoPor,
        dataInicio,
        dataFim,
        vitima,
        caso,
        lesoes,
        cidade,
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

      const filtros: any = {};

      if (categoria) filtros.categoria = { $regex: categoria as string, $options: "i" };
      if (tipo) {
        const tiposValidos = ["imagem", "texto"];
        if (!tiposValidos.includes(tipo as string)) {
          res.status(400).json({ msg: "Tipo inválido", opcoes: tiposValidos });
          return;
        }
        filtros.tipo = tipo;
      }

      if (sexo) {
        const sexosValidos = ["masculino", "feminino", "indeterminado"];
        if (!sexosValidos.includes(sexo as string)) {
          res.status(400).json({ msg: "Sexo inválido", opcoes: sexosValidos });
          return;
        }
        filtros["vitima.sexo"] = sexo;
      }

      if (estadoCorpo) {
        const estadosValidos = ["inteiro", "fragmentado", "carbonizado", "putrefacto", "esqueleto"];
        if (!estadosValidos.includes(estadoCorpo as string)) {
          res.status(400).json({ msg: "Estado do corpo inválido", opcoes: estadosValidos });
          return;
        }
        filtros["vitima.estadoCorpo"] = estadoCorpo;
      }

      if (vitima) {
        if (mongoose.Types.ObjectId.isValid(vitima as string)) {
          filtros["vitima._id"] = vitima;
        } else {
          const opcoesVitima = ["identificada", "não identificada"];
          if (!opcoesVitima.includes(vitima as string)) {
            res.status(400).json({
              msg: "Valor de vítima inválido",
              opcoes: ["identificada", "não identificada", "ou um ObjectId válido"],
            });
            return;
          }
          filtros["vitima.identificada"] = vitima === "identificada";
        }
      }

      if (caso) {
        const cases = await Case.find({ casoReferencia: { $regex: caso as string, $options: "i" } }).select("_id");
        filtros.caso = { $in: cases.map((c) => c._id) };
      }

      if (lesoes) {
        filtros["vitima.lesoes"] = { $regex: lesoes as string, $options: "i" };
      }

      if (cidade) {
        filtros["vitima.cidade"] = { $regex: cidade as string, $options: "i" };
      }

      if (coletadoPor) {
        const users = await User.find({ nome: { $regex: coletadoPor as string, $options: "i" } }).select("_id");
        if (users.length === 0) {
          res.status(200).json({
            evidencias: [],
            paginacao: { total: 0, paginaAtual: pageNum, porPagina: limitNum, totalPaginas: 0 },
          });
          return;
        }
        filtros.coletadoPor = { $in: users.map((user) => user._id) };
      }

      if (dataInicio || dataFim) {
        filtros.dataUpload = {};
        if (dataInicio) {
          const inicio = new Date(dataInicio as string);
          if (isNaN(inicio.getTime())) {
            res.status(400).json({ msg: "Data de início inválida" });
            return;
          }
          filtros.dataUpload.$gte = inicio;
        }

        if (dataFim) {
          const fim = new Date(dataFim as string);
          if (isNaN(fim.getTime())) {
            res.status(400).json({ msg: "Data de fim inválida" });
            return;
          }
          filtros.dataUpload.$lte = fim;
        }
      }

      const [evidencias, total] = await Promise.all([
        Evidence.find(filtros)
          .populate({
            path: "coletadoPor",
            select: "nome",
          })
          .populate({
            path: "vitima",
            select: "nome sexo estadoCorpo identificada cidade lesoes",
          })
          .populate({
            path: "caso",
            select: "casoReferencia",
          })
          .sort({ dataUpload: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Evidence.countDocuments(filtros),
      ]);

      const formattedEvidencias = evidencias.map((ev) => ({
        ...ev.toObject(),
        caso: ev.caso ? (ev.caso as any).casoReferencia : null,
        coletadoPor: ev.coletadoPor ? (ev.coletadoPor as any).nome : null,
      }));

      res.status(200).json({
        evidencias: formattedEvidencias,
        paginacao: {
          total,
          paginaAtual: pageNum,
          porPagina: limitNum,
          totalPaginas: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      console.error("Erro em listEvidences:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async getEvidenceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { evidenceId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
        res.status(400).json({ msg: "ID da evidência inválido." });
        return;
      }

      const evidence = await Evidence.findById(evidenceId)
        .populate("vitima", "nome sexo estadoCorpo identificada cidade lesoes")
        .populate("coletadoPor", "nome")
        .populate("caso", "casoReferencia");

      if (!evidence) {
        res.status(404).json({ msg: "Evidência não encontrada." });
        return;
      }

      const formattedEvidence = {
        ...evidence.toObject(),
        caso: evidence.caso ? (evidence.caso as any).casoReferencia : null,
        coletadoPor: evidence.coletadoPor ? (evidence.coletadoPor as any).nome : null,
      };

      res.status(200).json(formattedEvidence);
    } catch (err) {
      console.error("Erro em getEvidenceById:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async getFilterOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [coletadoPor, casos, cidades, lesoes, sexos] = await Promise.all([
        User.find({})
          .select("nome")
          .sort({ nome: 1 })
          .then((results) => results.map((r) => r.nome) || []),
          Case.find({})
          .select("casoReferencia")
          .sort({ casoReferencia: 1 })
          .then((results) => results.map((r) => r.casoReferencia).filter((value) => value !== null) || []),
        Evidence.aggregate([
          { $lookup: { from: "vitimas", localField: "vitima", foreignField: "_id", as: "vitimaDetails" } },
          { $unwind: "$vitimaDetails" },
          { $group: { _id: "$vitimaDetails.cidade" } },
          { $match: { _id: { $ne: null } } },
          { $sort: { _id: 1 } },
          { $project: { value: "$_id", _id: 0 } },
        ]).then((results) => results.map((r) => r.value) || []),
        Evidence.aggregate([
          { $lookup: { from: "vitimas", localField: "vitima", foreignField: "_id", as: "vitimaDetails" } },
          { $unwind: "$vitimaDetails" },
          { $group: { _id: "$vitimaDetails.lesoes" } },
          { $match: { _id: { $ne: null } } },
          { $sort: { _id: 1 } },
          { $project: { value: "$_id", _id: 0 } },
        ]).then((results) => results.map((r) => r.value) || []),
        Evidence.aggregate([
          { $lookup: { from: "vitimas", localField: "vitima", foreignField: "_id", as: "vitimaDetails" } },
          { $unwind: "$vitimaDetails" },
          { $group: { _id: "$vitimaDetails.sexo" } },
          { $match: { _id: { $ne: null } } },
          { $sort: { _id: 1 } },
          { $project: { value: "$_id", _id: 0 } },
        ]).then((results) => results.map((r) => r.value) || []),
      ]);
  
      res.status(200).json({
        coletadoPor,
        casos,
        cidades,
        lesoes,
        sexos,
      });
    } catch (err) {
      console.error("Erro em getFilterOptions:", err);
      res.status(500).json({ msg: "Erro ao buscar opções de filtro.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },
};