import { Request, Response, NextFunction } from "express";
import { Laudo, ILaudo } from "../models/LaudoModel";
import { Evidence, IEvidence } from "../models/EvidenceModel";
import { Vitima, IVitima } from "../models/VitimaModel";
import mongoose, { PopulatedDoc, Types } from "mongoose";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import moment from "moment";
import { OpenAI } from "openai";
import fs from "fs";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

type PopulatedLaudo = ILaudo & {
  evidencias: PopulatedDoc<IEvidence>[];
  caso?: Types.ObjectId;
  vitima: PopulatedDoc<IVitima>;
  perito: string;
};

async function generateLaudoPdfContent(
  laudo: PopulatedLaudo,
  evidencias: IEvidence[],
  vitima: IVitima,
  perito: string
): Promise<string> {
  const vitimaInfo = `
    Nome: ${vitima.nome || "Não identificada"}<br>
    Sexo: ${vitima.sexo || "Indeterminado"}<br>
    Estado do Corpo: ${vitima.estadoCorpo || "N/A"}<br>
    Identificada: ${vitima.identificada ? "Sim" : "Não"}
  `;
  const casoInfo = laudo.caso ? `Caso: ${laudo.caso}` : "Nenhum caso associado";

  const evidenceSummary = evidencias.length
    ? evidencias
        .map(
          (e) => `
        Categoria: ${e.categoria}
        Tipo: ${e.tipo}
        Conteúdo: ${e.conteudo || "N/A"}
        Data de Upload: ${moment(e.dataUpload).format("DD/MM/YYYY HH:mm")}
      `
        )
        .join("\n")
    : "Nenhuma evidência associada ao laudo.";

  let analiseLesoes = laudo.analiseLesoes || "";
  let conclusao = laudo.conclusao || "";

  try {
    const prompt = `
      Você é um perito forense especializado. Com base nas informações fornecidas, gere uma análise técnica e uma conclusão técnica para um relatório pericial. Mantenha o tom técnico-forense, profissional e objetivo, usando terminologia precisa conforme padrões brasileiros de perícia criminal.

      **Informações da Vítima**:
      ${vitimaInfo}

      **Informações das Evidências**:
      ${evidenceSummary}

      **Dados Antemortem**:
      ${laudo.dadosAntemortem || "N/A"}

      **Dados Postmortem**:
      ${laudo.dadosPostmortem || "N/A"}

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

  const evidenciasHtml = evidencias.length
    ? evidencias
        .map(
          (e) => `
        <p>
          <strong>Categoria:</strong> ${e.categoria}<br>
          <strong>Tipo:</strong> ${e.tipo}<br>
          <strong>Conteúdo:</strong> ${e.conteudo || "N/A"}<br>
          <strong>Data de Upload:</strong> ${moment(e.dataUpload).format("DD/MM/YYYY HH:mm")}
        </p>
      `
        )
        .join("")
    : "<p>Nenhuma evidência associada.</p>";

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Roboto', sans-serif; margin: 40px; color: #333; line-height: 1.6; }
          h1 { color: #1a3c6e; text-align: center; border-bottom: 2px solid #1a3c6e; padding-bottom: 10px; }
          h2 { color: #1a3c6e; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          p { margin: 5px 0; }
          .section { margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        </style>
      </head>
      <body>
        <h1>Laudo Pericial</h1>
        <div class="section">
          <h2>Informações do Caso</h2>
          <p>${casoInfo}</p>
        </div>
        <div class="section">
          <h2>Informações da Vítima</h2>
          <p>${vitimaInfo.replace(/\n/g, "<br />")}</p>
        </div>
        <div class="section">
          <h2>Informações do Laudo</h2>
          ${evidenciasHtml}
          <p><strong>Perito:</strong> ${perito}</p>
          <p><strong>Data de Criação:</strong> ${moment(laudo.dataCriacao).format("DD/MM/YYYY HH:mm:ss")}</p>
          <p><strong>Dados Antemortem:</strong> ${laudo.dadosAntemortem || "N/A"}</p>
          <p><strong>Dados Postmortem:</strong> ${laudo.dadosPostmortem || "N/A"}</p>
          <p><strong>Análise de Lesões:</strong> ${analiseLesoes}</p>
          <p><strong>Conclusão:</strong> ${conclusao}</p>
          <p><strong>Assinatura Digital:</strong> ${laudo.assinaturaDigital || "Não assinada"}</p>
        </div>
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
  async createLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log("Recebido req.body:", req.body); // Depuração

      const { vitima, perito, dadosAntemortem, dadosPostmortem } = req.body;

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

      // Verificar se vitima é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(vitima)) {
        res.status(400).json({ msg: "ID da vítima inválido." });
        return;
      }

      const vitimaDoc = await Vitima.findById(vitima);
      if (!vitimaDoc) {
        res.status(404).json({ msg: "Vítima não encontrada no banco de dados." });
        return;
      }

      const evidenciaDoc = await Evidence.findOne({ vitima }).sort({ dataUpload: -1 });
      if (!evidenciaDoc) {
        res.status(404).json({ msg: "Nenhuma evidência encontrada para a vítima selecionada." });
        return;
      }

      const casoDoc = await mongoose.model("Caso").findOne({ vitima }).sort({ _id: 1 });
      if (!casoDoc) {
        res.status(404).json({ msg: "Nenhum caso encontrado para a vítima selecionada." });
        return;
      }

      let analiseLesoes = "";
      let conclusao = "";
      try {
        const evidenceSummary = `
          Categoria: ${evidenciaDoc.categoria}
          Tipo: ${evidenciaDoc.tipo}
          Conteúdo: ${evidenciaDoc.conteudo || "N/A"}
          Data de Upload: ${moment(evidenciaDoc.dataUpload).format("DD/MM/YYYY HH:mm")}
        `;
        const vitimaInfo = `
          Nome: ${vitimaDoc.nome || "Não identificada"}
          Sexo: ${vitimaDoc.sexo || "N/A"}
          Estado do Corpo: ${vitimaDoc.estadoCorpo || "N/A"}
          Identificada: ${vitimaDoc.identificada ? "Sim" : "Não"}
        `;
        const prompt = `
          Você é um perito forense especializado. Com base nas informações fornecidas, gere uma análise técnica e uma conclusão técnica para um relatório pericial. Mantenha o tom técnico-forense, profissional e objetivo, usando terminologia precisa conforme padrões brasileiros de perícia criminal.

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

      try {
        console.log("Criando laudo com:", {
          evidencias: [evidenciaDoc._id],
          caso: casoDoc._id,
          vitima: vitimaDoc._id,
          perito,
          dadosAntemortem,
          dadosPostmortem,
          analiseLesoes,
          conclusao,
        });

        const novoLaudo = await Laudo.create({
          evidencias: [evidenciaDoc._id],
          caso: casoDoc._id,
          vitima: vitimaDoc._id,
          perito,
          dadosAntemortem,
          dadosPostmortem,
          analiseLesoes,
          conclusao,
        });

        const signatureData = `${perito}-${Date.now()}`;
        const assinaturaDigital = crypto.createHash("sha256").update(signatureData).digest("hex");
        novoLaudo.assinaturaDigital = assinaturaDigital;
        await novoLaudo.save();

        const populatedLaudo = await Laudo.findById(novoLaudo._id)
          .populate("evidencias")
          .populate("vitima");

        if (!populatedLaudo) {
          res.status(500).json({ msg: "Erro ao recuperar o laudo recém-criado." });
          return;
        }

        const htmlContent = await generateLaudoPdfContent(
          populatedLaudo as PopulatedLaudo,
          [evidenciaDoc],
          vitimaDoc,
          perito
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
      } catch (error) {
        console.error("Erro ao criar laudo no MongoDB:", error);
        res.status(400).json({ msg: "Erro ao salvar o laudo no banco de dados: " + (error instanceof Error ? error.message : String(error)) });
        return;
      }
    } catch (err) {
      console.error("Erro geral em createLaudo:", err);
      res.status(500).json({ msg: "Erro interno do servidor: " + (err instanceof Error ? err.message : String(err)) });
      next(err);
    }
  },

  async updateLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;
      const { vitima, perito, dadosAntemortem, dadosPostmortem, analiseLesoes, conclusao } = req.body;

      const updateFields: Partial<ILaudo> = {};
      if (vitima) updateFields.vitima = vitima;
      if (perito) updateFields.perito = perito;
      if (dadosAntemortem) updateFields.dadosAntemortem = dadosAntemortem;
      if (dadosPostmortem) updateFields.dadosPostmortem = dadosPostmortem;
      if (analiseLesoes) updateFields.analiseLesoes = analiseLesoes;
      if (conclusao) updateFields.conclusao = conclusao;

      if (vitima) {
        const vitimaDoc = await Vitima.findById(vitima);
        if (!vitimaDoc) {
          res.status(400).json({ msg: "Vítima não encontrada." });
          return;
        }
      }

      const updatedLaudo = await Laudo.findByIdAndUpdate(
        laudoId,
        updateFields,
        { new: true }
      )
        .populate("evidencias")
        .populate("vitima");

      if (!updatedLaudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      const htmlContent = await generateLaudoPdfContent(
        updatedLaudo as PopulatedLaudo,
        updatedLaudo.evidencias as IEvidence[] || [],
        updatedLaudo.vitima as IVitima,
        updatedLaudo.perito
      );

      const pdfBuffer = await generatePdf(htmlContent);
      fs.writeFileSync(`debug_updated_laudo_${laudoId}.pdf`, pdfBuffer);
      console.log(`PDF atualizado salvo para debug: debug_updated_laudo_${laudoId}.pdf`);

      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "Laudo atualizado com sucesso.", laudo: updatedLaudo, pdf: pdfBase64 });
    } catch (err) {
      console.error("Erro em updateLaudo:", err);
      next(err);
    }
  },

  async signLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;

      const laudo = await Laudo.findById(laudoId)
        .populate("evidencias")
        .populate("vitima");

      if (!laudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      if (laudo.assinaturaDigital) {
        res.status(400).json({ msg: "Laudo já está assinado digitalmente." });
        return;
      }

      const signatureData = `${laudo.perito}-${Date.now()}`;
      const assinaturaDigital = crypto.createHash("sha256").update(signatureData).digest("hex");
      laudo.assinaturaDigital = assinaturaDigital;
      await laudo.save();

      const htmlContent = await generateLaudoPdfContent(
        laudo as PopulatedLaudo,
        laudo.evidencias as IEvidence[] || [],
        laudo.vitima as IVitima,
        laudo.perito
      );

      const pdfBuffer = await generatePdf(htmlContent);
      fs.writeFileSync(`debug_signed_laudo_${laudoId}.pdf`, pdfBuffer);
      console.log(`PDF assinado salvo para debug: debug_signed_laudo_${laudoId}.pdf`);

      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "Laudo assinado com sucesso.", laudo, pdf: pdfBase64 });
    } catch (err) {
      console.error("Erro em signLaudo:", err);
      next(err);
    }
  },

  async listLaudos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { evidencia, caso } = req.query;
      const query: any = {};

      if (evidencia) query.evidencias = evidencia;
      if (caso) query.caso = caso;

      const laudos = await Laudo.find(query)
        .populate("evidencias")
        .populate("vitima");

      res.status(200).json({ laudos });
    } catch (err) {
      console.error("Erro em listLaudos:", err);
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
      next(err);
    }
  },
};

export default LaudoController;