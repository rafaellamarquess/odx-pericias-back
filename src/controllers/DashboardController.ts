import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Evidence } from "../models/EvidenceModel";

// Criando parâmetro de filtragens
interface Filtros {
    vitima?: { $regex: string; $options: string };
    sexo?: string;
    estado?: string;
    lesoes?: { $regex: string; $options: string };
    cidade?: { $regex: string; $options: string };
  }

// Interação com os filtros
export const DashboardController = {
    async filtrarCasos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vitima, 
             sexo, 
             estado, 
             lesoes, 
             cidade, 
             page = "1", 
             limit = "10" 
            } = req.query;

 
//Conversão da página
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

    //Página número
      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ msg: "Número da página inválido" });
        return;
      }

    //Página limite
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ msg: "Limite por página deve ser entre 1 e 100" });
        return;
      }


      // Criando o filto
      const filtros: Filtros = {};

      if (typeof vitima === 'string' && vitima) {
        filtros.vitima = { $regex: vitima, $options: 'i' };
      }
      if (typeof sexo === 'string' && sexo) {
        filtros.sexo = sexo;
      }
      if (typeof estado === 'string' && estado) {
        filtros.estado = estado;
      }
      if (typeof lesoes === 'string' && lesoes) {
        filtros.lesoes = { $regex: lesoes, $options: 'i' };
      }
      if (typeof cidade === 'string' && cidade) {
        filtros.cidade = { $regex: cidade, $options: 'i' };
      }
      

      // Consulta e Paginação
      const [casos, total] = await Promise.all([
        Evidence.find(filtros)
          .sort({ dataCriacao: -1 }) // Ordena por data de criação (mais recente primeiro)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Evidence.countDocuments(filtros),
      ]);

      // Resposta
      res.status(200).json({
        msg: "Casos filtrados com sucesso",
        casos,
        paginacao: {
          total,
          paginaAtual: pageNum,
          porPagina: limitNum,
          totalPaginas: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
