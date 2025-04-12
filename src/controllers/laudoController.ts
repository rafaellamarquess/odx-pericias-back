import { Request, Response, NextFunction } from "express";
import { Laudo } from "../models/LaudoModel";
import puppeteer from "puppeteer";

// Função para gerar o PDF do laudo
export const gerarPDFLaudo = async (laudoId: string) => {
  const laudo = await Laudo.findById(laudoId).populate("evidencias");

  if (!laudo) {
    throw new Error("Laudo não encontrado");
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <h1>${laudo.titulo}</h1>
    <p><strong>Descrição:</strong> ${laudo.descricao}</p>
    <p><strong>Objeto da Perícia:</strong> ${laudo.objetoPericia}</p>
    <p><strong>Análise Técnica:</strong> ${laudo.analiseTecnica}</p>
    <p><strong>Método Utilizado:</strong> ${laudo.metodoUtilizado}</p>
    <p><strong>Quem se Destina:</strong> ${laudo.destinatario}</p>
    <p><strong>Materiais Utilizados:</strong> ${laudo.materiaisUtilizados}</p>
    <p><strong>Exames Realizados:</strong> ${laudo.examesRealizados}</p>
    <p><strong>Considerações Técnico-Periciais:</strong> ${laudo.consideracoesTecnicoPericiais}</p>
    <p><strong>Conclusão Técnica Imparcial:</strong> ${laudo.conclusaoTecnica}</p>
    <h3>Evidências:</h3>
    <ul>
      ${laudo.evidencias.map((ev: any) => `<li>${ev.tipo} - ${ev.imagemURL || ev.conteudo}</li>`).join("")}
    </ul>
  `);

  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  return pdfBuffer;
};

// Rota para assinar digitalmente o laudo
export const assinarDigitalmente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { laudoId } = req.params;
    const laudo = await Laudo.findById(laudoId);

    if (!laudo) {
      return res.status(404).json({ msg: "Laudo não encontrado." });
    }

    laudo.assinadoDigitalmente = true;
    await laudo.save();

    res.status(200).json({ msg: `Laudo "${laudo.titulo}" assinado digitalmente.` });
  } catch (err) {
    next(err);
  }
};
