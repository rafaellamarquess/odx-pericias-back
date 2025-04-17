import { Report } from "../models/ReportModel";
import { Evidence } from "../models/EvidenceModel";
import { CustomRequest } from "../types/CustomRequest";
import { Case } from "../models/CaseModel";
import puppeteer from "puppeteer";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose"; // Para validação de IDs

export const reportController = {
  async gerarRelatorioCaso(req: Request, res: Response): Promise<void> {
    try {
      const { caseId } = req.params;

      // Validar o ID do caso
      if (!mongoose.Types.ObjectId.isValid(caseId)) {
        res.status(400).json({ msg: "ID de caso inválido." });
        return;
      }

      const caso = await Case.findById(caseId)
        .populate({
          path: "evidencias",
          populate: {
            path: "coletadoPor",
            select: "nome",
          },
        })
        .lean<{
          titulo: string;
          descricao: string;
          status: string;
          evidencias: Array<{
            _id: string;
            tipo: string;
            categoria: string;
            imagemURL?: string;
            conteudo?: string;
            coletadoPor?: { nome: string };
          }>;
        }>();

      if (!caso) {
        res.status(404).json({ msg: "Caso não encontrado." });
        return;
      }

      const evidenciasIds = caso.evidencias.map((e) => e._id);

      const report = await Report.findOne({
        evidencias: { $in: evidenciasIds },
      }).lean();

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado para este caso." });
        return;
      }

      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      const evidenciasHtml = caso.evidencias
        .map(
          (e) => `
        <div style="margin-bottom: 20px;">
          <h4>Evidência (${e.tipo}) - ${e.categoria}</h4>
          ${
            e.tipo === "imagem"
              ? `<img src="${e.imagemURL}" style="max-width: 300px;" />`
              : `<p>${e.conteudo}</p>`
          }
          <p><strong>Coletado por:</strong> ${e.coletadoPor?.nome || "Desconhecido"}</p>
        </div>
      `
        )
        .join("");

      await page.setContent(`
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1, h2, h3, h4 { color: #333; }
              p { margin: 4px 0; }
              .section { margin-bottom: 25px; }
            </style>
          </head>
          <body>
            <h1>Relatório Pericial</h1>

            <div class="section">
              <h2>Informações do Caso</h2>
              <p><strong>Título:</strong> ${caso.titulo}</p>
              <p><strong>Descrição:</strong> ${caso.descricao}</p>
              <p><strong>Status:</strong> ${caso.status}</p>
            </div>

            <div class="section">
              <h2>Detalhes do Relatório</h2>
              <p><strong>Título:</strong> ${report.titulo}</p>
              <p><strong>Descrição:</strong> ${report.descricao}</p>
              <p><strong>Destinatário:</strong> ${report.destinatario}</p>
              <p><strong>Objeto da Perícia:</strong> ${report.objetoPericia}</p>
              <p><strong>Método Utilizado:</strong> ${report.metodoUtilizado}</p>
              <p><strong>Materiais Utilizados:</strong> ${report.materiaisUtilizados}</p>
              <p><strong>Exames Realizados:</strong> ${report.examesRealizados}</p>
              <p><strong>Considerações Técnico-Periciais:</strong> ${report.consideracoesTecnicoPericiais}</p>
              <p><strong>Conclusão Técnica:</strong> ${report.conclusaoTecnica}</p>
              <p><strong>Assinado Digitalmente:</strong> ${report.assinadoDigitalmente ? "Sim" : "Não"}</p>
              <p><strong>Data de Criação:</strong> ${new Date(report.criadoEm).toLocaleString()}</p>
            </div>

            <div class="section">
              <h2>Evidências Relacionadas</h2>
              ${evidenciasHtml}
            </div>
          </body>
        </html>
      `);

      const pdf = await page.pdf({ format: "A4" });
      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="relatorio-caso-${caseId}.pdf"`
      );
      res.send(pdf);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Erro ao gerar relatório do caso." });
    }
  },

  async assinarDigitalmente(req: Request,res: Response,next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;

      // Validar o ID do relatório
      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400).json({ msg: "ID de relatório inválido." });
        return;
      }

      const report = await Report.findById(reportId);

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }

      report.assinadoDigitalmente = true;
      await report.save();

      res.status(200).json({
        msg: `Relatório "${report.titulo}" assinado digitalmente.`,
      });
    } catch (err) {
      next(err);
    }
  },

  async listarRelatorios(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verificar permissões
      if (!req.user || !["ADMIN", "PERITO"].includes(req.user.perfil)) {
        res.status(403).json({ msg: "Permissões insuficientes." });
        return;
      }

      // Configurar paginação
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Consultar relatórios com paginação e populate
      const relatorios = await Report.find()
        .populate("caso", "titulo descricao status")
        .populate("evidencias", "tipo categoria vitima sexo estadoCorpo")
        .skip(skip)
        .limit(limit)
        .lean();

      // Contar o total de relatórios para calcular o número de páginas
      const total = await Report.countDocuments();
      const totalPages = Math.ceil(total / limit);

      // Resposta formatada
      const response = {
        msg: relatorios.length === 0 ? "Nenhum relatório encontrado." : "Relatórios encontrados.",
        data: relatorios,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },

  async atualizarRelatorioCaso(req: CustomRequest,res: Response,next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400).json({ msg: "ID de relatório inválido." });
        return;
      }

      const report = await Report.findById(reportId);

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }

      if (report.assinadoDigitalmente) {
        res.status(403).json({
          msg: "Relatório já assinado digitalmente. Não pode ser editado.",
        });
        return;
      }

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
      } = req.body;

      if (titulo) report.titulo = titulo;
      if (descricao) report.descricao = descricao;
      if (objetoPericia) report.objetoPericia = objetoPericia;
      if (analiseTecnica) report.analiseTecnica = analiseTecnica;
      if (metodoUtilizado) report.metodoUtilizado = metodoUtilizado;
      if (destinatario) report.destinatario = destinatario;
      if (materiaisUtilizados) report.materiaisUtilizados = materiaisUtilizados;
      if (examesRealizados) report.examesRealizados = examesRealizados;
      if (consideracoesTecnicoPericiais)
        report.consideracoesTecnicoPericiais = consideracoesTecnicoPericiais;
      if (conclusaoTecnica) report.conclusaoTecnica = conclusaoTecnica;

      await report.save();

      res.status(200).json({
        msg: `Relatório "${report.titulo}" atualizado com sucesso.`,
        report,
      });
    } catch (err) {
      next(err);
    }
  },

  async deletarRelatorioCaso(req: CustomRequest,res: Response,next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;

      // Validar o ID do relatório
      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400).json({ msg: "ID de relatório inválido." });
        return;
      }

      const report = await Report.findById(reportId);

      if (!report) {
        res.status(404).json({ msg: "Relatório não encontrado." });
        return;
      }

      // Verificar se o relatório já foi assinado digitalmente
      if (report.assinadoDigitalmente) {
        res.status(403).json({
          msg: "Relatório já assinado digitalmente. Não pode ser deletado.",
        });
        return;
      }

      await Report.deleteOne({ _id: reportId });

      res.status(200).json({
        msg: `Relatório "${report.titulo}" deletado com sucesso.`,
      });
    } catch (err) {
      next(err);
    }
  },
};