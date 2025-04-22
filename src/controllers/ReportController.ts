import { Report } from "../models/ReportModel";
import { Evidence } from "../models/EvidenceModel";
import { Case } from "../models/CaseModel";
import puppeteer from "puppeteer";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

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
  
      // Busca o caso pelo _id
      const caso = await Case.findById(casoReferencia);
      if (!caso) {
        res.status(404).json({ msg: 'Caso não encontrado.' });
        return;
      }
  
      // Busca todas as evidências associadas a esse caso
      const evidencias = await Evidence.find({ caso: caso._id });
      if (!evidencias || evidencias.length === 0) {
        res.status(404).json({ msg: 'Nenhuma evidência encontrada para este caso.' });
        return;
      }
  
      // Criação do relatório
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
        assinadoDigitalmente: false
      });
  
      await report.save();
  
      // Geração do conteúdo HTML para o PDF
      const evidenciasHtml = evidencias.map(e => `
        <div style="margin-bottom: 20px;">
          <h4>Evidência (${e.tipo}) - ${e.categoria}</h4>
          ${e.tipo === "imagem" ? `<img src="${e.imagemURL}" style="max-width: 300px;" />` : `<p>${e.conteudo}</p>`}
          <p><strong>Coletado por:</strong> ${e.coletadoPor || "Desconhecido"}</p>
        </div>
      `).join("");
  
      const htmlContent = `
        <h1>Relatório de Perícia</h1>
        <h2>${titulo}</h2>
        <p><strong>Caso:</strong> ${caso.titulo}</p>
        <p><strong>Descrição:</strong> ${descricao}</p>
        <p><strong>Objeto da Perícia:</strong> ${objetoPericia}</p>
        <p><strong>Análise Técnica:</strong> ${analiseTecnica}</p>
        <p><strong>Método Utilizado:</strong> ${metodoUtilizado}</p>
        <p><strong>Destinatário:</strong> ${destinatario}</p>
        <p><strong>Materiais Utilizados:</strong> ${materiaisUtilizados}</p>
        <p><strong>Exames Realizados:</strong> ${examesRealizados}</p>
        <p><strong>Considerações Técnicas Periciais:</strong> ${consideracoesTecnicoPericiais}</p>
        <p><strong>Conclusão Técnica:</strong> ${conclusaoTecnica}</p>
        <h3>Evidências:</h3>
        ${evidenciasHtml}
      `;
  
      // Geração do PDF
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({ format: 'A4' });
      await browser.close();
  
      res.status(200).json({ msg: 'Relatório criado com sucesso.', report, pdf: pdfBuffer });
  
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      res.status(500).json({ msg: 'Erro ao gerar o relatório.', error });
    }
  },
  
  async assinarDigitalmente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId).populate('caso evidencias');
  
      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }
  
      report.assinadoDigitalmente = true;
      await report.save();
  
      // Regenerar o PDF com marca de assinatura
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
  
      const evidenciasHtml = report.evidencias.map((e: any) => `
        <div style="margin-bottom: 20px;">
          <h4>Evidência (${e.tipo}) - ${e.categoria}</h4>
          ${e.tipo === "imagem" ? `<img src="${e.imagemURL}" style="max-width: 300px;" />` : `<p>${e.conteudo}</p>`}
          <p><strong>Coletado por:</strong> ${e.coletadoPor || "Desconhecido"}</p>
        </div>
      `).join("");
  
      const htmlContent = `
        <h1>Relatório de Perícia</h1>
        <h2>${report.titulo}</h2>
        <p><strong>Caso:</strong> ${(report.caso as any).titulo}</p>
        <p><strong>Descrição:</strong> ${report.descricao}</p>
        <p><strong>Objeto da Perícia:</strong> ${report.objetoPericia}</p>
        <p><strong>Análise Técnica:</strong> ${report.analiseTecnica}</p>
        <p><strong>Método Utilizado:</strong> ${report.metodoUtilizado}</p>
        <p><strong>Destinatário:</strong> ${report.destinatario}</p>
        <p><strong>Materiais Utilizados:</strong> ${report.materiaisUtilizados}</p>
        <p><strong>Exames Realizados:</strong> ${report.examesRealizados}</p>
        <p><strong>Considerações Técnicas Periciais:</strong> ${report.consideracoesTecnicoPericiais}</p>
        <p><strong>Conclusão Técnica:</strong> ${report.conclusaoTecnica}</p>
        <h3>Evidências:</h3>
        ${evidenciasHtml}
        <p style="margin-top: 20px;"><strong>Assinado Digitalmente em:</strong> ${new Date().toLocaleString()}</p>
      `;
  
      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({ format: 'A4' });
  
      res.status(200).json({ msg: `Relatório "${report.titulo}" assinado digitalmente.`, pdf: pdfBuffer });
  
      await browser.close();
    } catch (err) {
      next(err);
    }
  },

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
        "caso",  // Caso relacionado ao relatório
        "evidencias",  // Evidências associadas ao relatório
        "assinadoDigitalmente"  // Status da assinatura digital
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
