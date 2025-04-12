import { Request, Response } from "express";
import { Paciente } from "../models/PatientModel";
import { RegistroDentario } from "../models/DentalRegistrationModel";

export const patientController = {

  async createPatient (req: Request, res: Response) : Promise<void> {
  try {
  const { nome, identificado, sexo, dataNascimento } = req.body;

  if (identificado && !nome) {
  res.status(400).json({ error: "Nome é obrigatório para pacientes identificados" });
  }

  const novoPaciente = await Paciente.create({
  nome: identificado ? nome : undefined,
  identificado,
  sexo,
  dataNascimento: identificado ? dataNascimento : undefined,
  });

  res.status(201).json(novoPaciente);
  } catch (error) {
  res.status(500).json({ error: "Erro ao criar paciente" });
  }
  },


  async uploadDentalRecord (req: Request, res: Response): Promise<void> {
  try {
  const { pacienteId, categoria, tipoExame, dataExame, observacoes } = req.body;

  if (!req.file || !req.file.path) {
  res.status(400).json({ error: "Imagem é obrigatória" });
  return;
  }

  const registro = await RegistroDentario.create({
  paciente: pacienteId,
  categoria,
  tipoExame,
  dataExame,
  observacoes,
  imagemUrl: req.file.path,
  });

  res.status(201).json(registro);
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: "Erro ao fazer upload do registro dentário" });
  }
  },


  async listDentalRecords (req: Request, res: Response) {
    try {
      const { pacienteId, dataInicio, dataFim, tipoExame } = req.query;

      const filtro: any = {};

      if (pacienteId) filtro.paciente = pacienteId;
      if (tipoExame) filtro.tipoExame = tipoExame;
      if (dataInicio || dataFim) {
        filtro.dataExame = {};
        if (dataInicio) filtro.dataExame.$gte = new Date(dataInicio as string);
        if (dataFim) filtro.dataExame.$lte = new Date(dataFim as string);
      }

      const registros = await RegistroDentario.find(filtro).populate("paciente");
      res.status(200).json(registros);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar registros" });
    }
  }
  }