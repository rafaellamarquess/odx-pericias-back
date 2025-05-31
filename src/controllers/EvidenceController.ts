import { NextFunction, Response, Request } from "express";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel";
import mongoose from "mongoose";
import { Vitima } from "../models/VitimaModel";

export const EvidenceController = {
  
// Criar evidência
async createEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const camposObrigatorios = [
      "categoria",
      "tipo",
      "sexo",
      "estadoCorpo",
      "coletadoPor",
      "casoReferencia"
    ];

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
      imagens, // opcional, usado apenas se quiser salvar direto
      lesoes,
      identificada,
      categoria,
      tipo,
      coletadoPor,
      conteudo,
      casoReferencia
    } = req.body;

    // Validação do tipo
    const tiposValidos = ["imagem", "texto"];
    if (!tiposValidos.includes(tipo)) {
      res.status(400).json({ msg: "Tipo de evidência inválido. Use 'imagem' ou 'texto'." });
      return;
    }

    // Buscar o caso
    const foundCase = await Case.findOne({ casoReferencia });
    if (!foundCase) {
      res.status(404).json({ msg: "Caso não encontrado com esse código de referência." });
      return;
    }

    // Criar nova vítima
    const novaVitima = await Vitima.create({
      nome,
      dataNascimento,
      idadeAproximada,
      nacionalidade,
      cidade,
      sexo,
      estadoCorpo,
      lesoes,
      imagens: req.file && req.file.path ? [req.file.path] : imagens || [],
      identificada: identificada ?? false
    });

    // Criar evidência
    let novaEvidencia;

    if (tipo === "imagem") {
      if (!req.file || !req.file.path) {
        res.status(400).json({ msg: "Arquivo de imagem não enviado." });
        return;
      }

      novaEvidencia = await Evidence.create({
        caso: foundCase._id,
        vitima: novaVitima._id,
        tipo,
        categoria,
        coletadoPor,
        imagemURL: req.file.path
      });
    } else {
      if (!conteudo) {
        res.status(400).json({ msg: "Conteúdo textual obrigatório para evidência do tipo texto." });
        return;
      }

      novaEvidencia = await Evidence.create({
        caso: foundCase._id,
        vitima: novaVitima._id,
        tipo,
        categoria,
        coletadoPor,
        conteudo
      });
    }

    // Atualizar o caso com a nova evidência
    await Case.updateOne(
      { _id: foundCase._id },
      { $push: { evidencias: novaEvidencia._id } }
    );

    res.status(201).json({
      msg: "Evidência e vítima cadastradas com sucesso.",
      vitima: novaVitima,
      evidence: novaEvidencia
    });
  } catch (err) {
    next(err);
  }
},

  // Editar evidência
async updateEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { evidenceId } = req.params;

    const allowedEvidenceFields = [
      "tipo",
      "categoria",
      "coletadoPor",
      "conteudo"
    ];

    const allowedVitimaFields = [
      "nome",
      "dataNascimento",
      "idadeAproximada",
      "nacionalidade",
      "cidade",
      "sexo",
      "estadoCorpo",
      "lesoes",
      "imagens",
      "identificada"
    ];

    const evidenceUpdate: any = {};
    const vitimaUpdate: any = {};

    // Separar os campos de atualização para cada entidade
    allowedEvidenceFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        evidenceUpdate[field] = req.body[field];
      }
    });

    allowedVitimaFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        vitimaUpdate[field] = req.body[field];
      }
    });

    // Upload de nova imagem (substituição de imagem)
    if (req.file && req.file.path) {
      evidenceUpdate.imagemURL = req.file.path;
    }

    // Atualizar evidência
    const existingEvidence = await Evidence.findById(evidenceId);
    if (!existingEvidence) {
      res.status(404).json({ msg: "Evidência não encontrada." });
      return;
    }

    const updatedEvidence = await Evidence.findByIdAndUpdate(
      evidenceId,
      evidenceUpdate,
      { new: true }
    );

    // Atualizar vítima, se houver campos para isso
    let updatedVitima = null;
    if (Object.keys(vitimaUpdate).length > 0) {
      updatedVitima = await Vitima.findByIdAndUpdate(
        existingEvidence.vitima,
        vitimaUpdate,
        { new: true }
      );
    }

    res.status(200).json({
      msg: "Evidência atualizada com sucesso.",
      updatedEvidence,
      updatedVitima
    });
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
// Aplicavel com filtros de pesquisa, data, status, responsável, caso de referência, cidade e estado.
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
      filtros.caso = { $regex: caso as string, $options: "i" };
    }

    if (lesoes) {
      filtros.lesoes = { $regex: lesoes as string, $options: "i" };
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
        .populate("coletadoPor", "nome")
        .sort({ dataUpload: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Evidence.countDocuments(filtros)
    ]);

    res.status(200).json({
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