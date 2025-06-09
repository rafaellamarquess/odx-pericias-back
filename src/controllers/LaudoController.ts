import { Request, Response, NextFunction } from "express";
import { Laudo, ILaudo } from "../models/LaudoModel";
import { Evidence, IEvidence } from "../models/EvidenceModel";
import { Vitima, IVitima } from "../models/VitimaModel";
import { Case, ICase } from "../models/CaseModel";
import { User, IUser } from "../models/UserModel";
import mongoose, { PopulatedDoc, Types } from "mongoose";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import moment from "moment";
import { OpenAI } from "openai";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    perfil: string;
    nome?: string;
  };
}

type PopulatedLaudo = ILaudo & {
  evidencias: PopulatedDoc<IEvidence & { vitima: IVitima }>[];
  vitima: PopulatedDoc<IVitima>;
  caso: PopulatedDoc<ICase>;
  perito: PopulatedDoc<IUser>;
};

async function generateLaudoPdfContent(
  laudo: PopulatedLaudo,
  evidencias: IEvidence[],
  vitima: IVitima,
  caso: ICase,
  peritoNome: string,
  signedBy?: string
): Promise<string> {
  const vitimaInfo = `
    <p><strong>Nome:</strong> ${vitima.nome || "Não identificada"}</p>
    <p><strong>Sexo:</strong> ${vitima.sexo || "Indeterminado"}</p>
    <p><strong>Estado do Corpo:</strong> ${vitima.estadoCorpo || "N/A"}</p>
    <p><strong>Idade Aproximada:</strong> ${vitima.idadeAproximada || "N/A"}</p>
    <p><strong>Nacionalidade:</strong> ${vitima.nacionalidade || "N/A"}</p>
    <p><strong>Cidade:</strong> ${vitima.cidade || "N/A"}</p>
    <p><strong>Data de Nascimento:</strong> ${
      vitima.dataNascimento ? moment(vitima.dataNascimento).format("DD/MM/YYYY") : "N/A"
    }</p>
    <p><strong>Lesões:</strong> ${vitima.lesoes || "N/A"}</p>
    <p><strong>Identificada:</strong> ${vitima.identificada ? "Sim" : "Não"}</p>
    ${
      vitima.imagens && vitima.imagens.length > 0
        ? vitima.imagens
            .map(
              (img) => `
                <img src="${img}" style="max-width: 200px; border: 1px solid #ddd; border-radius: 4px; margin: 5px;" />
              `
            )
            .join("")
        : "<p><strong>Imagens:</strong> Nenhuma imagem disponível</p>"
    }
  `;

  const casoInfo = `
    <p><strong>Título:</strong> ${caso.titulo || "N/A"}</p>
    <p><strong>Descrição:</strong> ${caso.descricao || "N/A"}</p>
    <p><strong>Status:</strong> ${caso.status || "N/A"}</p>
    <p><strong>Cidade:</strong> ${caso.cidade || "N/A"}</p>
    <p><strong>Estado:</strong> ${caso.estado || "N/A"}</p>
    <p><strong>Data de Criação:</strong> ${
      caso.dataCriacao ? moment(caso.dataCriacao).format("DD/MM/YYYY") : "N/A"
    }</p>
    <p><strong>Referência do Caso:</strong> ${caso.casoReferencia || "N/A"}</p>
  `;

  const evidenciasHtml = evidencias.length
    ? evidencias
        .map(
          (e) => `
        <div class="evidence-box">
          <h4>Evidência: ${e.categoria} (${e.tipo})</h4>
          <p><strong>Conteúdo:</strong> ${e.conteudo || "N/A"}</p>
          <p><strong>Data de Upload:</strong> ${moment(e.dataUpload).format("DD/MM/YYYY HH:mm")}</p>
          <p><strong>Coletado por:</strong> ${e.coletadoPor || "N/A"}</p>
        </div>
      `
        )
        .join("")
    : "<p>Nenhuma evidência associada.</p>";

  const signatureSection = signedBy
    ? `
        <div class="signature-box">
          <h3>Assinatura Digital</h3>
          <p><strong>Assinado por:</strong> ${signedBy}</p>
          <p><strong>Data:</strong> ${moment().format("DD/MM/YYYY HH:mm")}</p>
          <p><strong>Hash da Assinatura:</strong> ${laudo.assinaturaDigital || "N/A"}</p>
        </div>
      `
    : "";

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Roboto', sans-serif; margin: 40px; color: #333; line-height: 1.6; }
          h1 { color: #1a3c6e; text-align: center; border-bottom: 2px solid #1a3c6e; padding-bottom: 10px; }
          h2 { color: #1a3c6e; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          h3 { color: #2c5282; margin-top: 15px; }
          h4 { color: #2c5282; margin-bottom: 10px; }
          p { margin: 5px 0; }
          .section { margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
          .evidence-box { margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #fff; }
          .signature-box { margin-top: 30px; padding: 15px; border-top: 2px solid #1a3c6e; text-align: center; background-color: #edf2f7; border-radius: 8px; }
          img { margin: 10px 0; }
          strong { color: #2d3748; }
        </style>
      </head>
      <body>
        <h1>Laudo Pericial</h1>
        <div class="section">
          <h2>Informações do Caso</h2>
          ${casoInfo}
        </div>
        <div class="section">
          <h2>Informações da Vítima</h2>
          ${vitimaInfo}
        </div>
        <div class="section">
          <h2>Informações do Laudo</h2>
          ${evidenciasHtml}
          <p><strong>Perito:</strong> ${peritoNome}</p>
          <p><strong>Data de Criação:</strong> ${moment(laudo.dataCriacao).format("DD/MM/YYYY HH:mm:ss")}</p>
          <p><strong>Dados Antemortem:</strong> ${laudo.dadosAntemortem || "N/A"}</p>
          <p><strong>Dados Postmortem:</strong> ${laudo.dadosPostmortem || "N/A"}</p>
          <p><strong>Análise de Lesões:</strong> ${laudo.analiseLesoes || "N/A"}</p>
          <p><strong>Conclusão:</strong> ${laudo.conclusao || "N/A"}</p>
        </div>
        ${signatureSection}
      </body>
    </html>
  `;
}

async function generatePdf(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return Buffer.from(pdfBuffer);
}

const LaudoController = {
  async createLaudo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vitima, perito, dadosAntemortem, dadosPostmortem, caso, evidencias } = req.body;

      // Validação detalhada
      if (!vitima) {
        res.status(400).json({ msg: "Campo 'vitima' é obrigatório." });
        return;
      }
      if (!perito) {
        res.status(400).json({ msg: "Campo 'perito' é obrigatório." });
        return;
      }
      if (!dadosAntemortem) {
        res.status(400).json({ msg: "Campo 'dadosAntemortem' é obrigatório." });
        return;
      }
      if (!dadosPostmortem) {
        res.status(400).json({ msg: "Campo 'dadosPostmortem' é obrigatório." });
        return;
      }
      if (!caso) {
        res.status(400).json({ msg: "Campo 'caso' é obrigatório." });
        return;
      }
      if (!evidencias || !Array.isArray(evidencias) || evidencias.length === 0) {
        res.status(400).json({ msg: "Pelo menos uma evidência deve ser fornecida." });
        return;
      }

      // Verificar IDs válidos
      if (!mongoose.Types.ObjectId.isValid(vitima)) {
        res.status(400).json({ msg: "ID da vítima inválido." });
        return;
      }
      if (!mongoose.Types.ObjectId.isValid(perito)) {
        res.status(400).json({ msg: "ID do perito inválido." });
        return;
      }
      if (!mongoose.Types.ObjectId.isValid(caso)) {
        res.status(400).json({ msg: "ID do caso inválido." });
        return;
      }
      for (const evidenciaId of evidencias) {
        if (!mongoose.Types.ObjectId.isValid(evidenciaId)) {
          res.status(400).json({ msg: `ID de evidência inválido: ${evidenciaId}` });
          return;
        }
      }

      // Verificar existência dos documentos
      const vitimaDoc = await Vitima.findById(vitima);
      if (!vitimaDoc) {
        res.status(404).json({ msg: "Vítima não encontrada." });
        return;
      }

      const peritoDoc = await User.findById(perito).select("nome");
      if (!peritoDoc) {
        res.status(404).json({ msg: "Perito não encontrado." });
        return;
      }

      const casoDoc = await Case.findById(caso);
      if (!casoDoc) {
        res.status(404).json({ msg: "Caso não encontrado." });
        return;
      }

      const evidenciaDocs = await Evidence.find({ _id: { $in: evidencias }, vitima }).populate("vitima");
      if (evidenciaDocs.length !== evidencias.length) {
        res.status(404).json({ msg: "Uma ou mais evidências não foram encontradas ou não estão associadas à vítima." });
        return;
      }

      // Gerar análise de lesões e conclusão com LLM
      let analiseLesoes = "";
      let conclusao = "";
      try {
        const evidenceSummary = evidenciaDocs
          .map(
            (e) => `
              Categoria: ${e.categoria}
              Tipo: ${e.tipo}
              Conteúdo: ${e.conteudo || "N/A"}
              Data de Upload: ${moment(e.dataUpload).format("DD/MM/YYYY HH:mm")}
            `
          )
          .join("\n");
        const vitimaInfo = `
          Nome: ${vitimaDoc.nome || "Não identificada"}
          Sexo: ${vitimaDoc.sexo || "Indeterminado"}
          Estado do Corpo: ${vitimaDoc.estadoCorpo || "N/A"}
          Identificada: ${vitimaDoc.identificada ? "Sim" : "Não"}
        `;
        const prompt = `
          Você é um perito forense especializado. Com base nas informações fornecidas, gere uma análise técnica e uma conclusão técnica para um laudo pericial. Mantenha o tom técnico-forense, profissional e objetivo, usando terminologia precisa conforme padrões brasileiros de perícia criminal.

          **Informações do Caso**:
          Título: ${casoDoc.titulo}
          Descrição: ${casoDoc.descricao || "N/A"}
          Cidade: ${casoDoc.cidade || "N/A"}
          Estado: ${casoDoc.estado || "N/A"}

          **Informações da Vítima**:
          ${vitimaInfo}

          **Informações das Evidências**:
          ${evidenceSummary}

          **Dados Antemortem**:
          ${dadosAntemortem || "N/A"}

          **Dados Postmortem**:
          ${dadosPostmortem || "N/A"}

          **Tarefa**:
          - Gere uma **Análise de Lesões** (máximo 200 palavras) descrevendo as lesões observadas com base nas evidências e dados postmortem.
          - Gere uma **Conclusão** (máximo 100 palavras) resumindo os achados periciais.

          **Formato da Resposta**:
          {
            "analiseLesoes": "...",
            "conclusao": "..."
          }
        `;

        const completion = await openai.chat.completions.create({
          model: process.env.LLM_MODEL || "anthropic/claude-3.5-sonnet",
          messages: [
            { role: "system", content: "Você é um perito forense." },
            { role: "user", content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        });

        const llmOutput = completion.choices[0].message.content;
        const parsedOutput = JSON.parse(llmOutput || "{}");
        analiseLesoes = parsedOutput.analiseLesoes || "Análise de lesões não disponível.";
        conclusao = parsedOutput.conclusao || "Conclusão não disponível.";
      } catch (error) {
        console.error("Erro ao chamar OpenAI:", error instanceof Error ? error.message : error);
        analiseLesoes = "Análise de lesões não disponível.";
        conclusao = "Conclusão não disponível.";
      }

      // Criar o laudo
      const novoLaudo = new Laudo({
        evidencias: evidencias,
        caso: casoDoc._id,
        vitima: vitimaDoc._id,
        perito: peritoDoc._id,
        dadosAntemortem,
        dadosPostmortem,
        analiseLesoes,
        conclusao,
        assinaturaDigital: null,
      });

      await novoLaudo.save();

      // Assinar digitalmente
      const signatureData = `${peritoDoc._id}-${Date.now()}`;
      const assinaturaDigital = crypto.createHash("sha256").update(signatureData).digest("hex");
      novoLaudo.assinaturaDigital = assinaturaDigital;
      await novoLaudo.save();

      // Recuperar o laudo populado
      const populatedLaudo = await Laudo.findById(novoLaudo._id)
        .populate("evidencias")
        .populate("vitima")
        .populate("caso")
        .populate("perito", "nome");

      if (!populatedLaudo) {
        res.status(500).json({ msg: "Erro ao recuperar o laudo recém-criado." });
        return;
      }

      // Gerar PDF
      const htmlContent = await generateLaudoPdfContent(
        populatedLaudo as PopulatedLaudo,
        evidenciaDocs,
        vitimaDoc,
        casoDoc,
        peritoDoc.nome || "N/A",
        req.user?.nome || peritoDoc.nome
      );

      const pdfBuffer = await generatePdf(htmlContent);
      fs.writeFileSync(`debug_laudo_${novoLaudo._id}.pdf`, pdfBuffer);
      console.log(`PDF salvo para debug em debug_laudo_${novoLaudo._id}.pdf`);

      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(201).json({
        msg: "Laudo criado com sucesso.",
        laudo: populatedLaudo,
        pdf: pdfBase64,
      });
    } catch (err) {
      console.error("Erro em createLaudo:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async updateLaudo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;
      const { vitima, perito, dadosAntemortem, dadosPostmortem, analiseLesoes, conclusao, evidencias, caso } = req.body;

      const updateFields: Partial<ILaudo> = {};
      if (vitima) updateFields.vitima = vitima;
      if (perito) updateFields.perito = perito;
      if (dadosAntemortem) updateFields.dadosAntemortem = dadosAntemortem;
      if (dadosPostmortem) updateFields.dadosPostmortem = dadosPostmortem;
      if (analiseLesoes) updateFields.analiseLesoes = analiseLesoes;
      if (conclusao) updateFields.conclusao = conclusao;
      if (evidencias && Array.isArray(evidencias)) updateFields.evidencias = evidencias;
      if (caso) updateFields.caso = caso;

      // Validar IDs
      if (vitima && !mongoose.Types.ObjectId.isValid(vitima)) {
        res.status(400).json({ msg: "ID da vítima inválido." });
        return;
      }
      if (perito && !mongoose.Types.ObjectId.isValid(perito)) {
        res.status(400).json({ msg: "ID do perito inválido." });
        return;
      }
      if (caso && !mongoose.Types.ObjectId.isValid(caso)) {
        res.status(400).json({ msg: "ID do caso inválido." });
        return;
      }
      if (evidencias) {
        for (const evidenciaId of evidencias) {
          if (!mongoose.Types.ObjectId.isValid(evidenciaId)) {
            res.status(400).json({ msg: `ID de evidência inválido: ${evidenciaId}` });
            return;
          }
        }
      }

      // Verificar existência dos documentos
      if (vitima) {
        const vitimaDoc = await Vitima.findById(vitima);
        if (!vitimaDoc) {
          res.status(404).json({ msg: "Vítima não encontrada." });
          return;
        }
      }
      if (perito) {
        const peritoDoc = await User.findById(perito).select("nome");
        if (!peritoDoc) {
          res.status(404).json({ msg: "Perito não encontrado." });
          return;
        }
      }
      if (caso) {
        const casoDoc = await Case.findById(caso);
        if (!casoDoc) {
          res.status(404).json({ msg: "Caso não encontrado." });
          return;
        }
      }
      if (evidencias) {
        const evidenciaDocs = await Evidence.find({ _id: { $in: evidencias }, vitima });
        if (evidenciaDocs.length !== evidencias.length) {
          res.status(404).json({ msg: "Uma ou mais evidências não foram encontradas ou não estão associadas à vítima." });
          return;
        }
      }

      // Atualizar o laudo
      const updatedLaudo = await Laudo.findByIdAndUpdate(laudoId, updateFields, { new: true })
        .populate("evidencias")
        .populate("vitima")
        .populate("caso")
        .populate("perito", "nome");

      if (!updatedLaudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      // Gerar PDF
      const peritoDoc = await User.findById(updatedLaudo.perito).select("nome");
      const htmlContent = await generateLaudoPdfContent(
        updatedLaudo as PopulatedLaudo,
        updatedLaudo.evidencias as IEvidence[],
        updatedLaudo.vitima as IVitima,
        updatedLaudo.caso as ICase,
        peritoDoc?.nome || "N/A",
        req.user?.nome || peritoDoc?.nome
      );

      const pdfBuffer = await generatePdf(htmlContent);
      fs.writeFileSync(`debug_updated_laudo_${laudoId}.pdf`, pdfBuffer);
      console.log(`PDF atualizado salvo para debug: debug_updated_laudo_${laudoId}.pdf`);

      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "Laudo atualizado com sucesso.", laudo: updatedLaudo, pdf: pdfBase64 });
    } catch (err) {
      console.error("Erro em updateLaudo:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async signLaudo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;

      const laudo = await Laudo.findById(laudoId)
        .populate("evidencias")
        .populate("vitima")
        .populate("caso")
        .populate("perito", "nome");

      if (!laudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      if (laudo.assinaturaDigital) {
        res.status(400).json({ msg: "Laudo já está assinado digitalmente." });
        return;
      }

      const peritoDoc = await User.findById(laudo.perito).select("nome");
      if (!peritoDoc) {
        res.status(404).json({ msg: "Perito não encontrado." });
        return;
      }

      const signatureData = `${laudo.perito}-${Date.now()}`;
      const assinaturaDigital = crypto.createHash("sha256").update(signatureData).digest("hex");
      laudo.assinaturaDigital = assinaturaDigital;
      await laudo.save();

      const htmlContent = await generateLaudoPdfContent(
        laudo as PopulatedLaudo,
        laudo.evidencias as IEvidence[],
        laudo.vitima as IVitima,
        laudo.caso as ICase,
        peritoDoc.nome || "N/A",
        req.user?.nome || peritoDoc.nome
      );

      const pdfBuffer = await generatePdf(htmlContent);
      fs.writeFileSync(`debug_signed_laudo_${laudoId}.pdf`, pdfBuffer);
      console.log(`PDF assinado salvo para debug: debug_signed_laudo_${laudoId}.pdf`);

      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "Laudo assinado com sucesso.", laudo, pdf: pdfBase64 });
    } catch (err) {
      console.error("Erro em signLaudo:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async listLaudos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        evidencia,
        caso,
        vitima,
        perito,
        dataInicio,
        dataFim,
        page = "1",
        limit = "10",
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ msg: "Número da página inválido." });
        return;
      }
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ msg: "Limite por página deve ser entre 1 e 100." });
        return;
      }

      const query: any = {};
      if (evidencia) {
        if (!mongoose.Types.ObjectId.isValid(evidencia as string)) {
          res.status(400).json({ msg: "ID da evidência inválido." });
          return;
        }
        query.evidencias = evidencia;
      }
      if (caso) {
        if (!mongoose.Types.ObjectId.isValid(caso as string)) {
          res.status(400).json({ msg: "ID do caso inválido." });
          return;
        }
        query.caso = caso;
      }
      if (vitima) {
        if (!mongoose.Types.ObjectId.isValid(vitima as string)) {
          res.status(400).json({ msg: "ID da vítima inválido." });
          return;
        }
        query.vitima = vitima;
      }
      if (perito) {
        if (!mongoose.Types.ObjectId.isValid(perito as string)) {
          res.status(400).json({ msg: "ID do perito inválido." });
          return;
        }
        query.perito = perito;
      }
      if (dataInicio || dataFim) {
        query.dataCriacao = {};
        if (dataInicio) {
          const inicio = new Date(dataInicio as string);
          if (isNaN(inicio.getTime())) {
            res.status(400).json({ msg: "Data de início inválida." });
            return;
          }
          query.dataCriacao.$gte = inicio;
        }
        if (dataFim) {
          const fim = new Date(dataFim as string);
          if (isNaN(fim.getTime())) {
            res.status(400).json({ msg: "Data de fim inválida." });
            return;
          }
          query.dataCriacao.$lte = fim;
        }
      }

      const [laudos, total] = await Promise.all([
        Laudo.find(query)
          .populate("evidencias", "categoria tipo conteudo dataUpload coletadoPor")
          .populate("vitima", "nome sexo estadoCorpo identificada")
          .populate("caso", "titulo descricao casoReferencia")
          .populate("perito", "nome")
          .sort({ dataCriacao: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Laudo.countDocuments(query),
      ]);

      res.status(200).json({
        msg: "Laudos listados com sucesso.",
        laudos,
        paginacao: {
          total,
          paginaAtual: pageNum,
          totalPaginas: Math.ceil(total / limitNum),
          limitePorPagina: limitNum,
        },
      });
    } catch (err) {
      console.error("Erro em listLaudos:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },

  async deleteLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;

      const deleted = await Laudo.findByIdAndDelete(laudoId);
      if (!deleted) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      res.status(200).json({ msg: "Laudo deletado com sucesso." });
    } catch (err) {
      console.error("Erro em deleteLaudo:", err);
      res.status(500).json({ msg: "Erro interno do servidor.", error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  },
};

export default LaudoController;