import { Request, Response, NextFunction } from "express";
import { Laudo, ILaudo } from "../models/LaudoModel";
import { Evidence, IEvidence } from "../models/EvidenceModel";
import { User, IUser } from "../models/UserModel";
import { Vitima, IVitima } from "../models/VitimaModel";
import mongoose, { PopulatedDoc, Types } from "mongoose";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import moment from "moment";
import fs from "fs";
import crypto from "crypto";

type PopulatedLaudo = ILaudo & {
  evidencias?: PopulatedDoc<IEvidence>[];
  caso?: Types.ObjectId;
  vitima: PopulatedDoc<IVitima>;
  perito: PopulatedDoc<IUser>;
};

async function generateLaudoPdfContent(
  laudo: PopulatedLaudo,
  evidencias: IEvidence[],
  vitima: IVitima,
  perito: IUser | null
): Promise<string> {
  const peritoNome = perito?.nome || "N/A";
  const vitimaInfo = `
    Nome: ${vitima.nome || "Não identificada"}<br>
    Sexo: ${vitima.sexo || "Indeterminado"}<br>
    Estado do Corpo: ${vitima.estadoCorpo || "N/A"}<br>
    Identificada: ${vitima.identificada ? "Sim" : "Não"}
  `;
  const casoInfo = laudo.caso ? `Caso: ${laudo.caso}` : "Nenhum caso associado";

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
          <p><strong>Perito:</strong> ${peritoNome}</p>
          <p><strong>Data de Criação:</strong> ${moment(laudo.dataCriacao).format("DD/MM/YYYY HH:mm:ss")}</p>
          <p><strong>Dados Antemortem:</strong> ${laudo.dadosAntemortem || "N/A"}</p>
          <p><strong>Dados Postmortem:</strong> ${laudo.dadosPostmortem || "N/A"}</p>
          <p><strong>Análise de Lesões:</strong> ${laudo.analiseLesoes || "N/A"}</p>
          <p><strong>Conclusão:</strong> ${laudo.conclusao || "N/A"}</p>
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
      const {
        evidencias,
        caso,
        vitima,
        perito,
        dadosAntemortem,
        dadosPostmortem,
        analiseLesoes,
        conclusao,
      } = req.body;

      if (!vitima || !perito || !dadosAntemortem || !dadosPostmortem || !analiseLesoes || !conclusao) {
        res.status(400).json({ msg: "Todos os campos obrigatórios devem ser preenchidos." });
        return;
      }

      const vitimaDoc = await Vitima.findById(vitima);
      if (!vitimaDoc) {
        res.status(404).json({ msg: "Vítima não encontrada." });
        return;
      }

      const peritoDoc = await User.findById(perito);
      if (!peritoDoc) {
        res.status(404).json({ msg: "Perito não encontrado." });
        return;
      }

      let evidenciasDocs: IEvidence[] = [];
      if (evidencias && evidencias.length > 0) {
        evidenciasDocs = await Evidence.find({ _id: { $in: evidencias } });
        if (evidenciasDocs.length !== evidencias.length) {
          res.status(400).json({ msg: "Uma ou mais evidências não foram encontradas." });
          return;
        }
      }

      if (caso && !mongoose.Types.ObjectId.isValid(caso)) {
        res.status(400).json({ msg: "ID do caso inválido." });
        return;
      }

      const novoLaudo = await Laudo.create({
        evidencias: evidenciasDocs.map((e) => e._id),
        caso,
        vitima: vitimaDoc._id,
        perito,
        dadosAntemortem,
        dadosPostmortem,
        analiseLesoes,
        conclusao,
      });

      const populatedLaudo = await Laudo.findById(novoLaudo._id)
        .populate("evidencias")
        .populate("vitima")
        .populate("perito");

      const htmlContent = await generateLaudoPdfContent(
        populatedLaudo as PopulatedLaudo,
        evidenciasDocs,
        vitimaDoc,
        peritoDoc
      );

      const pdfBuffer = await generatePdf(htmlContent);
      fs.writeFileSync("debug_laudo.pdf", pdfBuffer);
      console.log("PDF salvo para debug em debug_laudo.pdf");

      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(201).json({ msg: "Laudo criado com sucesso.", laudo: populatedLaudo, pdf: pdfBase64 });
    } catch (err) {
      next(err);
    }
  },

  async updateLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;
      const { evidencias, caso, vitima, dadosAntemortem, dadosPostmortem, analiseLesoes, conclusao } = req.body;

      const updateFields: Partial<ILaudo> = {};
      if (evidencias !== undefined) updateFields.evidencias = evidencias;
      if (caso !== undefined) updateFields.caso = caso;
      if (vitima) updateFields.vitima = vitima;
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

      if (evidencias && evidencias.length > 0) {
        const evidenciasDocs = await Evidence.find({ _id: { $in: evidencias } });
        if (evidenciasDocs.length !== evidencias.length) {
          res.status(400).json({ msg: "Uma ou mais evidências não foram encontradas." });
          return;
        }
        updateFields.evidencias = evidenciasDocs.map((e) => e._id) as IEvidence[];
      }

      if (caso && !mongoose.Types.ObjectId.isValid(caso)) {
        res.status(400).json({ msg: "ID do caso inválido." });
        return;
      }

      const updatedLaudo = await Laudo.findByIdAndUpdate(laudoId, updateFields, { new: true })
        .populate("evidencias")
        .populate("vitima")
        .populate("perito");

      if (!updatedLaudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      const htmlContent = await generateLaudoPdfContent(
        updatedLaudo as PopulatedLaudo,
        updatedLaudo.evidencias as IEvidence[] || [],
        updatedLaudo.vitima as IVitima,
        updatedLaudo.perito as IUser
      );

      const pdfBuffer = await generatePdf(htmlContent);
      fs.writeFileSync("debug_updated_laudo.pdf", pdfBuffer);
      console.log("PDF atualizado salvo para debug em debug_updated_laudo.pdf");

      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "Laudo atualizado com sucesso.", laudo: updatedLaudo, pdf: pdfBase64 });
    } catch (err) {
      next(err);
    }
  },

  async signLaudo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;

      const laudo = await Laudo.findById(laudoId)
        .populate("evidencias")
        .populate("vitima")
        .populate("perito");

      if (!laudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      if (laudo.assinaturaDigital) {
        res.status(400).json({ msg: "Laudo já está assinado digitalmente." });
        return;
      }

      const signatureData = `${laudo.perito._id}-${Date.now()}`;
      const assinaturaDigital = crypto.createHash("sha256").update(signatureData).digest("hex");

      laudo.assinaturaDigital = assinaturaDigital;
      await laudo.save();

      const htmlContent = await generateLaudoPdfContent(
        laudo as PopulatedLaudo,
        laudo.evidencias as IEvidence[] || [],
        laudo.vitima as IVitima,
        laudo.perito as IUser
      );

      const pdfBuffer = await generatePdf(htmlContent);
      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "Laudo assinado com sucesso.", laudo, pdf: pdfBase64 });
    } catch (err) {
      next(err);
    }
  },

  async listLaudos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vitima } = req.query;
      const query: any = {};

      if (vitima) {
        if (!mongoose.Types.ObjectId.isValid(vitima as string)) {
          res.status(400).json({ msg: "ID da vítima inválido." });
          return;
        }
        query.vitima = vitima;
      }

      const laudos = await Laudo.find(query)
        .populate("evidencias")
        .populate("vitima")
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

  async generateLaudoPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laudoId } = req.params;

      const laudo = await Laudo.findById(laudoId)
        .populate("evidencias")
        .populate("vitima")
        .populate("perito");

      if (!laudo) {
        res.status(404).json({ msg: "Laudo não encontrado." });
        return;
      }

      const htmlContent = await generateLaudoPdfContent(
        laudo as PopulatedLaudo,
        laudo.evidencias as IEvidence[] || [],
        laudo.vitima as IVitima,
        laudo.perito as IUser
      );

      const pdfBuffer = await generatePdf(htmlContent);
      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "PDF gerado com sucesso.", pdf: pdfBase64 });
    } catch (err) {
      next(err);
    }
  },
};

export default LaudoController;