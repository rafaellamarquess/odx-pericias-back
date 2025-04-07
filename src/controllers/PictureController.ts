import { Request, Response } from 'express';
import multer from 'multer';
import Picture from '../models/picture'; // Ajuste o caminho se necessário

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const create = async (req: MulterRequest, res: Response) => {
  try {
    console.log('Arquivo recebido:', req.file); // Verifica o Multer
    console.log('Picture importado:', Picture); // Verifica o modelo

    const { name } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const picture = new Picture({
      name,
      src: file.path
    });

    await picture.save();
    res.json({ picture, msg: 'Imagem salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    res.status(500).json({ message: 'Erro ao salvar imagem', error});
  }
};