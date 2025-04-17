import { NextFunction, Response, Request } from "express";
import cloudinary from "../config/cloudinary";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel"; // Importando o modelo de "Case"
import mongoose from "mongoose";

export const EvidenceController = {

  // Adicionar evidência
  async createEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseTitle, tipo } = req.params;
      const { categoria, vitima, sexo, estadoCorpo, lesoes, coletadoPor, conteudo } = req.body;
  
      // Verifica tipo
      const tiposValidos = ["imagem", "texto"];
      if (!tipo || !tiposValidos.includes(tipo)) {
        res.status(400).json({ msg: "Tipo de evidência inválido ou ausente. Use 'imagem' ou 'texto'." });
        return;
      }
  
      // Verifica campos obrigatórios comuns
      if (!categoria || !vitima || !sexo || !estadoCorpo || !lesoes || !coletadoPor) {
        res.status(400).json({ msg: "Todos os campos obrigatórios devem ser preenchidos: categoria, vitima, sexo, estadoCorpo, lesoes, coletadoPor." });
        return;
      }
  
      // Busca o caso pelo título
      const foundCase = await Case.findOne({ titulo: caseTitle });
      if (!foundCase) {
        res.status(404).json({ msg: "Caso não encontrado com esse título." });
        return;
      }
  
      const caseId = foundCase._id;
  
      let evidence;
  
      if (tipo === "imagem") {
        if (!req.file?.path) {
          res.status(400).json({ msg: "Arquivo de imagem não enviado." });
          return;
        }
  
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "evidencias",
          use_filename: true,
          unique_filename: false
        });
  
        evidence = await Evidence.create({
          tipo: "imagem",
          categoria,
          vitima,
          sexo,
          estadoCorpo,
          lesoes,
          coletadoPor,
          imagemURL: result.secure_url,
          caso: caseId
        });
      }
  
      if (tipo === "texto") {
        if (!conteudo) {
          res.status(400).json({ msg: "Conteúdo textual obrigatório para evidência do tipo texto." });
          return;
        }
  
        evidence = await Evidence.create({
          tipo: "texto",
          categoria,
          vitima,
          sexo,
          estadoCorpo,
          lesoes,
          coletadoPor,
          conteudo,
          caso: caseId
        });
      }
  
      res.status(200).json({ msg: "Evidência adicionada com sucesso.", evidence });
    } catch (err) {
      next(err);
    }
  },  

  //Editar evidências
  async updateEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { evidenceId } = req.params;
      // Lista apenas dos campos que PODEM ser atualizados
      const allowedFields = [
        "caso",
        "tipo",
        "categoria",
        "vitima",
        "sexo",
        "estadoCorpo",
        "lesoes",
        "coletadoPor",
        "conteudo",
        "imagemURL",
        "laudo"
      ];
  
      const updateFields: any = {};
  
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });
  
      if (req.body.dataUpload !== undefined) {
        delete req.body.dataUpload;
      }
  
      const updatedEvidence = await Evidence.findByIdAndUpdate(evidenceId, updateFields, { new: true });
  
      if (!updatedEvidence) {
        res.status(404).json({ msg: "Evidência não encontrada." });
        return;
      }
  
      res.status(200).json({ msg: "Evidência atualizada com sucesso.", updatedEvidence });
    } catch (err) {
      next(err);
    }
  },  


  //Deletar evidência
  async deleteEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { evidenceId } = req.params;

      const deleted = await Evidence.findByIdAndDelete(evidenceId);

      if (!deleted) {
        res.status(404).json({ msg: "Evidência não encontrada." });
        return;
      }

      res.status(200).json({ msg: "Evidência deletada com sucesso." });
    } catch (err) {
      next(err);
    }
  },

// Listar evidências
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
        page = "1",
        limit = "10"
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
  
      if (categoria) filtros.categoria = categoria;
  
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
        filtros.sexo = sexo;
      }
  
      if (estadoCorpo) {
        const estadosValidos = ["inteiro", "fragmentado", "carbonizado", "putrefacto", "esqueleto"];
        if (!estadosValidos.includes(estadoCorpo as string)) {
          res.status(400).json({ msg: "Estado do corpo inválido", opcoes: estadosValidos });
          return;
        }
        filtros.estadoCorpo = estadoCorpo;
      }
  
      if (vitima) {
        const opcoesVitima = ["identificada", "não identificada"];
        if (!opcoesVitima.includes(vitima as string)) {
          res.status(400).json({ msg: "Valor de vítima inválido", opcoes: opcoesVitima });
          return;
        }
        filtros.vitima = vitima;
      }
  
      if (caso) {
        filtros.caso = { $regex: caso as string, $options: "i" }; // busca parcial e case-insensitive
      }
  
      if (lesoes) {
        filtros.lesoes = { $regex: lesoes as string, $options: "i" }; // busca parcial
      }
  
      if (coletadoPor) {
        if (!mongoose.Types.ObjectId.isValid(coletadoPor as string)) {
          res.status(400).json({ msg: "ID do coletor inválido" });
          return;
        }
        filtros.coletadoPor = new mongoose.Types.ObjectId(coletadoPor as string);
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
          .populate("coletadoPor", "nome email")
          .sort({ dataUpload: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Evidence.countDocuments(filtros)
      ]);
  
      res.status(200).json({
        msg: "Evidências listadas com sucesso",
        evidencias,
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
