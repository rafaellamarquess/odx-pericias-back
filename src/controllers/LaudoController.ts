import { Request, Response, NextFunction } from "express";
import { Laudo, ILaudo } from "../models/LaudoModel";
import { Evidence, IEvidence } from "../models/EvidenceModel";
import { User, IUser } from "../models/UserModel";
import mongoose, { PopulatedDoc } from "mongoose";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import moment from "moment";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PopulatedLaudo = ILaudo & {
  evidencias: PopulatedDoc<IEvidence>[];
  perito: PopulatedDoc<IUser>;
};

async function generateLaudoPdfContent(
  laudo: PopulatedLaudo,
  evidencias: IEvidence[],
  perito: IUser | null
): Promise<string> {
  const peritoNome = perito?.nome || "N/A";

  // Preparar resumo das evidências para o LLM
  const evidenceSummary = evidencias
    .map(
      (e) => `
        Categoria: ${e.categoria}
        Tipo: ${e.tipo}
        Conteúdo: ${e.conteudo || "N/A"}
        Data de Upload: ${moment(e.dataUpload).format("DD/MM/YYYY HH:mm")}
      `
    )
    .join("\n");

  // Inicializar analiseLesoes e conclusao com valores existentes ou placeholders
  let analiseLesoes = laudo.analiseLesoes || "N/A";
  let conclusao = laudo.conclusao || "N/A";

  // Chamar o LLM para gerar análise de lesões e conclusão
  try {
    const prompt = `
      Você é um perito forense especializado. Com base nas informações fornecidas, gere uma análise de lesões e uma conclusão para um laudo pericial. Mantenha o tom profissional, objetivo e em linguagem técnico-forense em português.

      **Informações das Evidências**:
      ${evidenceSummary}

      **Tarefa**:
      - Gere uma **Análise de Lesões** (máximo 200 palavras) descrevendo as lesões observadas com base nas evidências, incluindo possíveis causas e características.
      - Gere uma **Conclusão** (máximo 100 palavras) resumindo os achados periciais e suas implicações.

      **Formato da Resposta**:
      {
        "analiseLesoes": "...",
        "conclusao": "..."
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um perito forense." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const llmOutput = completion.choices[0].message.content;
    const parsedOutput = JSON.parse(llmOutput || '{}');
    analiseLesoes = parsedOutput.analiseLesoes || analiseLesoes;
    conclusao = parsedOutput.conclusao || conclusao;
  } catch (error) {
    console.error("Erro ao chamar OpenAI:", error);
    // Fallback para valores existentes ou placeholders
    analiseLesoes = laudo.analiseLesoes || "Análise de lesões não disponível devido a erro no LLM.";
    conclusao = laudo.conclusao || "Conclusão não disponível devido a erro no LLM.";
  }

  // Gerar HTML para as evidências
  const evidenciasHtml = evidencias
    .map(
      (e) =>
        `<p><strong>Categoria:</strong> ${e.categoria} | <strong>Tipo:</strong> ${e.tipo}</p>`
    )
    .join("");

  // HTML completo do laudo
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
          <h2>Informações do Laudo</h2>
          ${evidenciasHtml}
          <p><strong>Perito:</strong> ${peritoNome}</p>
          <p><strong>Data de Criação:</strong> ${moment(laudo.dataCriacao).format("DD/MM/YYYY HH:mm")}</p>
          <p><strong>Dados Antemortem:</strong> ${laudo.dadosAntemortem}</p>
          <p><strong>Dados Postmortem:</strong> ${laudo.dadosPostmortem}</p>
          <p><strong>Análise de Lesões:</strong> ${analiseLesoes}</p>
          <p><strong>Conclusão:</strong> ${conclusao}</p>
          <p><strong>Assinatura Digital:</strong> ${laudo.assinaturaDigital || "N/A"}</p>
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
      const {
        evidencias,
        perito,
        dadosAntemortem,
        dadosPostmortem,
        analiseLesoes,
        conclusao,
        assinaturaDigital,
      } = req.body;

      if (
        !Array.isArray(evidencias) ||
        evidencias.length === 0 ||
        !perito ||
        !dadosAntemortem ||
        !dadosPostmortem ||
        !analiseLesoes ||
        !conclusao
      ) {
        res.status(400).json({ msg: "Todos os campos obrigatórios devem ser preenchidos." });
        return;
      }

      const evidenciasDocs = await Evidence.find({ _id: { $in: evidencias } });
      if (!evidenciasDocs.length) {
        res.status(404).json({ msg: "Nenhuma evidência válida encontrada." });
        return;
      }

      const peritoDoc = await User.findById(perito);
      if (!peritoDoc) {
        res.status(404).json({ msg: "Perito não encontrado." });
        return;
      }

      if (evidenciasDocs.length !== evidencias.length) {
        res.status(404).json({ msg: "Uma ou mais evidências não foram encontradas." });
        return;
      }

      const novoLaudo = await Laudo.create({
        evidencias,
        perito,
        dadosAntemortem,
        dadosPostmortem,
        analiseLesoes,
        conclusao,
        assinaturaDigital,
      });

      const htmlContent = await generateLaudoPdfContent(
        {
          ...novoLaudo.toObject(),
          evidencias: evidenciasDocs.map((e) => e.toObject() as IEvidence),
          perito: peritoDoc.toObject() as IUser,
        } as unknown as PopulatedLaudo,
        evidenciasDocs,
        peritoDoc
      );

      const pdfBuffer = await generatePdf(htmlContent);
      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(201).json({ msg: "Laudo criado com sucesso.", laudo: novoLaudo, pdf: pdfBase64 });
    } catch (err) {
      next(err);
    }
  },

  async updateLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;

      const allowedFields = [
        "dadosAntemortem",
        "dadosPostmortem",
        "analiseLesoes",
        "conclusao",
        "assinaturaDigital",
      ];

      const updateFields: Partial<ILaudo> = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateFields[field as keyof ILaudo] = req.body[field];
        }
      });

      const updatedLaudo = await Laudo.findByIdAndUpdate(laudoId, updateFields, { new: true })
        .populate("evidencias")
        .populate("perito");

      if (!updatedLaudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      const htmlContent = await generateLaudoPdfContent(
        updatedLaudo as PopulatedLaudo,
        updatedLaudo.evidencias as IEvidence[],
        updatedLaudo.perito as IUser
      );

      const pdfBuffer = await generatePdf(htmlContent);
      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "Laudo atualizado com sucesso.", laudo: updatedLaudo, pdf: pdfBase64 });
    } catch (err) {
      next(err);
    }
  },

  async listLaudos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const laudos = await Laudo.find()
        .populate("evidencias")
        .populate("perito");

      res.status(200).json({ laudos });
    } catch (err) {
      next(err);
    }
  },

  async deleteLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;
      const deleted = await Laudo.findByIdAndDelete(laudoId);

      if (!deleted) {
        res.status(404).json({ msg: "Laudo não encontrado para deletar." });
        return;
      }

      res.status(200).json({ msg: "Laudo deletado com sucesso." });
    } catch (err) {
      next(err);
    }
  },
};

export default LaudoController;