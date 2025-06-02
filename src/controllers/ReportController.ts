import { Report, IReport } from "../models/ReportModel";
import { Evidence, IEvidence } from "../models/EvidenceModel";
import { Case, ICase } from "../models/CaseModel";
import { Vitima, IVitima } from "../models/VitimaModel";
import { Laudo, ILaudo } from "../models/LaudoModel";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import fs from "fs";
import axios from "axios";
import moment from "moment";
import User from "../models/UserModel";
import upload from "../middlewares/uploadMiddleware"; // Ensure upload is correctly imported as a middleware function

// Interface para req.user (JWT middleware)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    perfil: string;
    nome?: string;
  };
}

// Função para validar URL do Cloudinary
function isValidCloudinaryURL(url: string): boolean {
  return (
    typeof url === "string" &&
    url.startsWith("https://res.cloudinary.com/") &&
    (url.includes("/audio/") || url.includes(".mp3") || url.includes(".wav"))
  );
}

// Função para gerar o conteúdo do relatório em HTML
async function generatePdfContent(
  report: IReport,
  caso: ICase,
  evidencias: IEvidence[],
  vitimas: IVitima[],
  laudos: ILaudo[],
  signedBy?: string
): Promise<string> {
  // Buscar o nome do responsável no modelo User
  let responsavelNome = "N/A";
  if (caso.responsavel) {
    try {
      const user = await User.findById(caso.responsavel).select("nome").exec();
      if (user && user.nome) {
        responsavelNome = user.nome;
      }
    } catch (err) {
      console.error(`Erro ao buscar nome do responsável ${caso.responsavel}:`, err);
    }
  }

  // Seção de detalhes do caso
  const caseDetails = `
    <h2>Detalhes do Caso</h2>
    <p><strong>Título:</strong> ${caso.titulo}</p>
    <p><strong>Descrição:</strong> ${caso.descricao}</p>
    <p><strong>Status:</strong> ${caso.status}</p>
    <p><strong>Responsável:</strong> ${responsavelNome}</p>
    <p><strong>Cidade:</strong> ${caso.cidade}</p>
    <p><strong>Estado:</strong> ${caso.estado}</p>
    <p><strong>Data de Criação:</strong> ${moment(caso.dataCriacao).format("DD/MM/YYYY")}</p>
    <p><strong>Referência do Caso:</strong> ${caso.casoReferencia}</p>
  `;

  // Seção de vítimas
  const vitimasHtml = vitimas
    .map(
      (v: IVitima) => `
        <div class="vitima-box">
          <h4>Vítima: ${v.nome || "Não identificado"}</h4>
          <p><strong>Sexo:</strong> ${v.sexo}</p>
          <p><strong>Estado do Corpo:</strong> ${v.estadoCorpo}</p>
          <p><strong>Idade Aproximada:</strong> ${v.idadeAproximada || "N/A"}</p>
          <p><strong>Nacionalidade:</strong> ${v.nacionalidade || "N/A"}</p>
          <p><strong>Cidade:</strong> ${v.cidade || "N/A"}</p>
          <p><strong>Data de Nascimento:</strong> ${
            v.dataNascimento ? moment(v.dataNascimento).format("DD/MM/YYYY") : "N/A"
          }</p>
          <p><strong>Lesões:</strong> ${v.lesoes || "N/A"}</p>
          <p><strong>Identificada:</strong> ${v.identificada ? "Sim" : "Não"}</p>
          ${
            v.imagemURL && v.imagemURL.length > 0
              ? v.imagemURL
                  .map(
                    (img) => `
                      <img src="${img}" style="max-width: 200px; border: 1px solid #ddd; border-radius: 4px; margin: 5px;" />
                    `
                  )
                  .join("")
              : "<p><strong>Imagens:</strong> Nenhuma imagem disponível</p>"
          }
        </div>
      `
    )
    .join("");

  // Seção de evidências
  const evidenciasHtml = await Promise.all(
    evidencias.map(async (e: IEvidence) => {
      let imageBase64 = "";
      if (e.tipo === "imagem" && e.conteudo) {
        try {
          const response = await axios.get<ArrayBuffer>(e.conteudo, {
            responseType: "arraybuffer",
          });
          imageBase64 = Buffer.from(response.data).toString("base64");
          console.log(`Imagem ${e.conteudo} convertida, tamanho base64: ${imageBase64.length}`);
        } catch (err) {
          console.error(`Erro ao carregar imagem ${e.conteudo}:`, err);
          imageBase64 = "";
        }
      }

      // Buscar a vítima associada à evidência
      const vitima = vitimas.find((v) => v._id.toString() === e.vitima.toString());
      const vitimaNome = vitima ? vitima.nome || "Não identificado" : "N/A";
      const vitimaSexo = vitima ? vitima.sexo : "N/A";
      const vitimaEstadoCorpo = vitima ? vitima.estadoCorpo : "N/A";

      return `
        <div class="evidence-box">
          <h4>Evidência: ${e.categoria} (${e.tipo})</h4>
          ${
            e.tipo === "imagem" && imageBase64
              ? `<img src="data:image/jpeg;base64,${imageBase64}" style="max-width: 300px; border: 1px solid #ddd; border-radius: 4px;" />`
              : `<p><strong>Conteúdo:</strong> ${e.conteudo || "N/A"}</p>`
          }
          <p><strong>Data de Upload:</strong> ${moment(e.dataUpload).format("DD/MM/YYYY HH:mm")}</p>
          <p><strong>Vítima:</strong> ${vitimaNome}</p>
          <p><strong>Sexo da Vítima:</strong> ${vitimaSexo}</p>
          <p><strong>Estado do Corpo:</strong> ${vitimaEstadoCorpo}</p>
          <p><strong>Coletado por:</strong> ${e.coletadoPor}</p>
        </div>
      `;
    })
  ).then((htmls) => htmls.join(""));

  // Seção de laudos
  const laudosHtml = await Promise.all(
    laudos.map(async (l: ILaudo) => {
      const perito = l.perito ? await User.findById(l.perito).select("nome").exec() : null;
      return `
        <div class="laudo-box">
          <h4>Laudo</h4>
          <p><strong>Dados Antemortem:</strong> ${l.dadosAntemortem}</p>
          <p><strong>Dados Postmortem:</strong> ${l.dadosPostmortem}</p>
          <p><strong>Análise de Lesões:</strong> ${l.analiseLesoes}</p>
          <p><strong>Conclusão:</strong> ${l.conclusao}</p>
          <p><strong>Data de Criação:</strong> ${moment(l.dataCriacao).format("DD/MM/YYYY HH:mm")}</p>
          <p><strong>Perito:</strong> ${perito?.nome || "N/A"}</p>
          <p><strong>Assinatura Digital:</strong> ${l.assinaturaDigital || "N/A"}</p>
        </div>
      `;
    })
  ).then((htmls) => htmls.join(""));

  // Seção de assinatura digital
  const signatureSection = signedBy
    ? `
        <div class="signature-box">
          <h3>Assinatura Digital</h3>
          <p><strong>Assinado por:</strong> ${signedBy}</p>
          <p><strong>Data:</strong> ${moment().format("DD/MM/YYYY HH:mm")}</p>
        </div>
      `
    : "";

  // Seção de áudio
  const audioSection = report.audioURL
    ? `
        <div class="section">
          <h2>Observação em Áudio</h2>
          <p><strong>Link do Áudio:</strong> <a href="${report.audioURL}">${report.audioURL}</a></p>
        </div>
      `
    : "";

  // HTML completo do relatório
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
          .evidence-box, .vitima-box, .laudo-box { margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #fff; }
          .signature-box { margin-top: 30px; padding: 15px; border-top: 2px solid #1a3c6e; text-align: center; background-color: #edf2f7; border-radius: 8px; }
          img { margin: 10px 0; }
          strong { color: #2d3748; }
        </style>
      </head>
      <body>
        <h1>Relatório de Perícia</h1>
        <div class="section">
          <h2>Informações do Relatório</h2>
          <p><strong>Título:</strong> ${report.titulo}</p>
          <p><strong>Descrição:</strong> ${report.descricao}</p>
          <p><strong>Objeto da Perícia:</strong> ${report.objetoPericia}</p>
          <p><strong>Análise Técnica:</strong> ${report.analiseTecnica}</p>
          <p><strong>Método Utilizado:</strong> ${report.metodoUtilizado}</p>
          <p><strong>Destinatário:</strong> ${report.destinatario}</p>
          <p><strong>Materiais Utilizados:</strong> ${report.materiaisUtilizados}</p>
          <p><strong>Exames Realizados:</strong> ${report.examesRealizados}</p>
          <p><strong>Considerações Técnicas Periciais:</strong> ${report.consideracoesTecnicoPericiais}</p>
          <p><strong>Conclusão Técnica:</strong> ${report.conclusaoTecnica}</p>
        </div>
        <div class="section">
          ${caseDetails}
        </div>
        <div class="section">
          <h2>Vítimas</h2>
          ${vitimasHtml || "<p>Nenhuma vítima associada ao caso.</p>"}
        </div>
        <div class="section">
          <h2>Evidências</h2>
          ${evidenciasHtml || "<p>Nenhuma evidência associada ao caso.</p>"}
        </div>
        <div class="section">
          <h2>Laudos</h2>
          ${laudosHtml || "<p>Nenhum laudo associado ao caso.</p>"}
        </div>
        ${signatureSection}
        ${audioSection}
      </body>
    </html>
  `;
}

// Função para gerar o PDF a partir do HTML
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

export const ReportController = {
  // Middleware para upload do áudio
  uploadAudio: (req: Request, res: Response, next: NextFunction) => {
    upload.single("audio")(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ msg: "Erro ao fazer upload do áudio.", error: err.message });
      }
      next();
    });
  },

  async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        titulo,
        descricao,
        objetoPericia,
        analiseTecnica,
        metodoUtilizado,
        destinatario,
        materiaisUtilizados,
        examesRealizados,
        consideracoesTecnicoPericiais,
        conclusaoTecnica,
        casoReferencia,
        audioURL,
      } = req.body;

      // Validação dos campos obrigatórios
      if (
        !titulo ||
        !descricao ||
        !objetoPericia ||
        !analiseTecnica ||
        !metodoUtilizado ||
        !destinatario ||
        !materiaisUtilizados ||
        !examesRealizados ||
        !consideracoesTecnicoPericiais ||
        !conclusaoTecnica ||
        !casoReferencia
      ) {
        res.status(400).json({ msg: "Todos os campos obrigatórios devem ser preenchidos." });
        return;
      }

      // Processar áudio
      let finalAudioURL: string | undefined;
      if (req.file) {
        // URL gerada pelo multer-storage-cloudinary
        finalAudioURL = (req.file as any).path; // Cloudinary URL
      } else if (audioURL) {
        // Validar URL fornecida
        if (!isValidCloudinaryURL(audioURL)) {
          res.status(400).json({ msg: "URL de áudio inválida. Deve ser uma URL válida do Cloudinary." });
          return;
        }
        finalAudioURL = audioURL;
      }

      // Buscar o caso
      const caso = await Case.findById(casoReferencia);
      if (!caso) {
        res.status(404).json({ msg: "Caso não encontrado." });
        return;
      }

      // Buscar evidências associadas ao caso
      const evidencias = await Evidence.find({ caso: caso._id });
      if (!evidencias.length) {
        res.status(404).json({ msg: "Nenhuma evidência encontrada para este caso." });
        return;
      }

      // Buscar vítimas associadas às evidências
      const vitimaIds = Array.from(new Set(evidencias.map((e) => e.vitima.toString())));
      const vitimas = await Vitima.find({ _id: { $in: vitimaIds } });
      if (!vitimas.length) {
        res.status(404).json({ msg: "Nenhuma vítima encontrada para este caso." });
        return;
      }

      // Buscar laudos associados às evidências
      const evidenciaIds = evidencias.map((e) => e._id);
      const laudos = await Laudo.find({ evidencia: { $in: evidenciaIds } });

      // Criar o relatório
      const report = new Report({
        titulo,
        descricao,
        objetoPericia,
        analiseTecnica,
        metodoUtilizado,
        destinatario,
        materiaisUtilizados,
        examesRealizados,
        consideracoesTecnicoPericiais,
        conclusaoTecnica,
        caso: caso._id,
        evidencias: evidencias.map((e) => e._id),
        vitimas: vitimas.map((v) => v._id),
        laudos: laudos.map((l) => l._id),
        audioURL: finalAudioURL,
        assinadoDigitalmente: false,
      });
      await report.save();

      // Gerar o conteúdo do relatório
      const htmlContent = await generatePdfContent(report, caso, evidencias, vitimas, laudos);
      const pdfBuffer = await generatePdf(htmlContent);

      // Salvar PDF para debug
      fs.writeFileSync("debug.pdf", pdfBuffer);
      console.log("PDF salvo para debug em debug.pdf");

      // Converter para base64
      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({ msg: "Relatório criado com sucesso.", report, pdf: pdfBase64 });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      res.status(500).json({ msg: "Erro ao gerar o relatório.", error: errorMessage });
    }
  },

  async assinarDigitalmente(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;

      // Buscar o relatório com as entidades relacionadas
      const report = await Report.findById(reportId)
        .populate<{ caso: ICase }>("caso")
        .populate<{ evidencias: IEvidence[] }>("evidencias")
        .populate<{ vitimas: IVitima[] }>("vitimas")
        .populate<{ laudos: ILaudo[] }>("laudos");

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }

      if (!report.caso) {
        res.status(500).json({ msg: "Erro: Caso não foi populado corretamente." });
        return;
      }

      // Usar as vítimas e laudos populados
      const vitimas = report.vitimas;
      const laudos = report.laudos;

      if (!vitimas.length) {
        res.status(404).json({ msg: "Nenhuma vítima encontrada para este caso." });
        return;
      }

      // Buscar o nome do usuário que está assinando
      let signedBy = "Usuário Desconhecido";
      if (req.user?.id) {
        const user = await User.findById(req.user.id).select("nome").exec();
        if (user?.nome) {
          signedBy = user.nome;
        }
      }

      // Converter evidências para objeto puro
      const plainEvidencias: IEvidence[] = report.evidencias.map((e: IEvidence) => e.toObject());

      // Gerar o conteúdo do relatório com assinatura
      const htmlContent = await generatePdfContent(
        report.toObject() as IReport,
        report.caso,
        plainEvidencias,
        vitimas,
        laudos,
        signedBy
      );
      const pdfBuffer = await generatePdf(htmlContent);

      // Salvar PDF para debug
      fs.writeFileSync("debug_signed.pdf", pdfBuffer);
      console.log("PDF assinado salvo para debug em debug_signed.pdf");

      // Atualizar o relatório com a assinatura digital
      report.assinadoDigitalmente = true;
      await report.save();

      // Converter para base64
      const pdfBase64 = pdfBuffer.toString("base64");

      res.status(200).json({
        msg: `Relatório "${report.titulo}" assinado digitalmente.`,
        pdf: pdfBase64,
      });
    } catch (error) {
      console.error("Erro ao assinar relatório:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      res.status(500).json({ msg: "Erro ao assinar o relatório.", error: errorMessage });
    }
  },


  // GESTÃO DE RELATÓRIO
  
  // Função para atualizar um relatório (PRECISA GERAR OUTRO RELATÓRIO EM PDF APÓS MODIFICAÇÕES)
  async updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const allowedFields = [
        "titulo",
        "descricao",
        "objetoPericia",
        "analiseTecnica",
        "metodoUtilizado",
        "destinatario",
        "materiaisUtilizados",
        "examesRealizados",
        "consideracoesTecnicoPericiais",
        "conclusaoTecnica",
        "caso",  
        "evidencias", 
        "assinadoDigitalmente"  
      ];
  
      const updateFields: any = {};
  
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });
  
      const report = await Report.findByIdAndUpdate(reportId, updateFields, { new: true });
  
      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }
  
      res.status(200).json({ msg: "Relatório atualizado com sucesso.", report });
    } catch (err) {
      next(err);
    }
  },

  async deleteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
  
      const report = await Report.findByIdAndDelete(reportId);
  
      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }
  
      res.status(200).json({ msg: "Relatório deletado com sucesso." });
    } catch (err) {
      next(err);
    }
  },
  
  async listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        titulo, 
        descricao, 
        caso, 
        dataInicio, 
        dataFim, 
        assinadoDigitalmente, 
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
  
      if (titulo) {
        filtros.titulo = { $regex: titulo as string, $options: "i" };
      }
  
      if (descricao) {
        filtros.descricao = { $regex: descricao as string, $options: "i" };
      }
  
      if (caso) {
        if (!mongoose.Types.ObjectId.isValid(caso as string)) {
          res.status(400).json({ msg: "ID do caso inválido" });
          return;
        }
        filtros.caso = new mongoose.Types.ObjectId(caso as string);
      }
  
      if (assinadoDigitalmente) {
        const assinado = assinadoDigitalmente === "true";
        filtros.assinadoDigitalmente = assinado;
      }
  
      if (dataInicio || dataFim) {
        filtros.criadoEm = {};
        if (dataInicio) {
          const inicio = new Date(dataInicio as string);
          if (isNaN(inicio.getTime())) {
            res.status(400).json({ msg: "Data de início inválida" });
            return;
          }
          filtros.criadoEm.$gte = inicio;
        }
  
        if (dataFim) {
          const fim = new Date(dataFim as string);
          if (isNaN(fim.getTime())) {
            res.status(400).json({ msg: "Data de fim inválida" });
            return;
          }
          filtros.criadoEm.$lte = fim;
        }
      }
  
      const [relatorios, total] = await Promise.all([
        Report.find(filtros)
          .populate("caso", "titulo descricao")
          .populate("evidencias", "categoria tipo imagemURL conteudo")
          .sort({ criadoEm: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Report.countDocuments(filtros)
      ]);
  
      res.status(200).json({
        msg: "Relatórios listados com sucesso",
        relatorios,
        paginacao: {
          total,
          paginaAtual: pageNum,
          totalPaginas: Math.ceil(total / limitNum),
          limitePorPagina: limitNum
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
function sanitizeHtml(categoria: any) {
  throw new Error("Function not implemented.");
}

