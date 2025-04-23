import { Report, IReport } from "../models/ReportModel";
import { Evidence, IEvidence } from "../models/EvidenceModel";
import { Case, ICase } from "../models/CaseModel";
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import fs from "fs";
import axios from "axios";
import moment from "moment";
import User from "../models/UserModel";

// Interface  pra req.user (JWT middleware)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    perfil: string;
    nome?: string;
  };
}

// Para gerar o conteudo do relatorio
async function generatePdfContent(report: IReport, caso: ICase, evidencias: IEvidence[], signedBy?: string): Promise<string> {
  // Buscar o nome do responsável no modelo User
  let responsavelNome = "N/A"; // Valor padrão caso o responsável não seja encontrado
  if (caso.responsavel) {
    try {
      const user = await User.findById(caso.responsavel).select('nome').exec();
      if (user && user.nome) {
        responsavelNome = user.nome;
      }
    } catch (err) {
      console.error(`Erro ao buscar nome do responsável ${caso.responsavel}:`, err);
    }
  }

  const caseDetails = `
    <h2>Detalhes do Caso</h2>
    <p><strong>Título:</strong> ${caso.titulo}</p>
    <p><strong>Descrição:</strong> ${caso.descricao}</p>
    <p><strong>Status:</strong> ${caso.status}</p>
    <p><strong>Responsável:</strong> ${responsavelNome}</p>
    <p><strong>Cidade:</strong> ${caso.cidade}</p>
    <p><strong>Estado:</strong> ${caso.estado}</p>
    <p><strong>Data de Criação:</strong> ${moment(caso.dataCriacao).format('DD/MM/YYYY')}</p>
    <p><strong>Referência do Caso:</strong> ${caso.casoReferencia}</p>
  `;

  const evidenciasHtml = await Promise.all(
    evidencias.map(async (e: IEvidence) => {
      let imageBase64 = "";
      if (e.tipo === "imagem" && e.imagemURL) {
        try {
          const response = await axios.get<ArrayBuffer>(e.imagemURL, {
            responseType: 'arraybuffer',
          });
          imageBase64 = Buffer.from(response.data).toString('base64');
          console.log(`Imagem ${e.imagemURL} convertida, tamanho base64: ${imageBase64.length}`);
        } catch (err) {
          console.error(`Erro ao carregar imagem ${e.imagemURL}:`, err);
          imageBase64 = "";
        }
      }
      return `
        <div class="evidence-box">
          <h4>Evidência: ${e.categoria} (${e.tipo})</h4>
          ${
            e.tipo === "imagem" && imageBase64
              ? `<img src="data:image/jpeg;base64,${imageBase64}" style="max-width: 300px; border: 1px solid #ddd; border-radius: 4px;" />`
              : `<p><strong>Conteúdo:</strong> ${e.conteudo || "N/A"}</p>`
          }
          <p><strong>Data de Upload:</strong> ${moment(e.dataUpload).format('DD/MM/YYYY HH:mm')}</p>
          <p><strong>Vítima:</strong> ${e.vitima}</p>
          <p><strong>Sexo:</strong> ${e.sexo}</p>
          <p><strong>Estado do Corpo:</strong> ${e.estadoCorpo}</p>
          <p><strong>Lesões:</strong> ${e.lesoes || "N/A"}</p>
          <p><strong>Coletado por:</strong> ${e.coletadoPor}</p>
          <p><strong>Laudo:</strong> ${e.laudo || "N/A"}</p>
        </div>
      `;
    })
  ).then((htmls) => htmls.join(""));

  const signatureSection = signedBy
    ? `
        <div class="signature-box">
          <h3>Assinatura Digital</h3>
          <p><strong>Assinado por:</strong> ${signedBy}</p>
          <p><strong>Data:</strong> ${moment().format('DD/MM/YYYY HH:mm')}</p>
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
          <h2>Evidências</h2>
          ${evidenciasHtml}
        </div>
        ${signatureSection}
      </body>
    </html>
  `;
}

// Para gerar o relatório em PDF
async function generatePdf(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return Buffer.from(pdfBuffer);
}

export const ReportController = {
  async createReport(req: Request, res: Response): Promise<void> {
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
      } = req.body;

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
        res.status(400).json({ msg: "Todos os campos obrigatórios devem be preenchidos." });
        return;
      }

      const caso = await Case.findById(casoReferencia);
      if (!caso) {
        res.status(404).json({ msg: 'Caso não encontrado.' });
        return;
      }

      const evidencias = await Evidence.find({ caso: caso._id });
      if (!evidencias || evidencias.length === 0) {
        res.status(404).json({ msg: 'Nenhuma evidência encontrada para este caso.' });
        return;
      }

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
        evidencias: evidencias.map(e => e._id),
        assinadoDigitalmente: false,
      });
      await report.save();

      const htmlContent = await generatePdfContent(report, caso, evidencias);
      const pdfBuffer = await generatePdf(htmlContent);

      fs.writeFileSync('debug.pdf', pdfBuffer);
      console.log('PDF salvo para debug em debug.pdf');

      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      res.status(200).json({ msg: 'Relatório criado com sucesso.', report, pdf: pdfBase64 });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ msg: 'Erro ao gerar o relatório.', error: errorMessage });
    }
  },

  // Função para assinar digitalmente o relatório
  async assinarDigitalmente(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;

      const report = await Report.findById(reportId)
        .populate<{ caso: ICase }>('caso')
        .populate<{ evidencias: IEvidence[] }>('evidencias');

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }

      if (!report.caso) {
        res.status(500).json({ msg: "Erro: Caso não foi populado corretamente." });
        return;
      }

      let signedBy = "Usuário Desconhecido";
      if (req.user?.id) {
        const user = await User.findById(req.user.id).select('nome');
        if (user) {
          signedBy = user.nome;
        }
      }

      const plainEvidencias: IEvidence[] = report.evidencias.map((e: IEvidence) => e.toObject());

      const htmlContent = await generatePdfContent(
        report.toObject() as unknown as IReport, 
        report.caso, 
        plainEvidencias, 
        signedBy
      );
      const pdfBuffer = await generatePdf(htmlContent);

      fs.writeFileSync('debug_signed.pdf', pdfBuffer);
      console.log('PDF assinado salvo para debug em debug_signed.pdf');

      report.assinadoDigitalmente = true;
      await report.save();

      // Converter para base64
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      res.status(200).json({ msg: `Relatório "${report.titulo}" assinado digitalmente.`, pdf: pdfBase64 });
    } catch (error) {
      console.error("Erro ao assinar relatório:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ msg: 'Erro ao assinar o relatório.', error: errorMessage });
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

