const Picture = require("../models/picture")
import { Request, Response } from 'express';
import multer from 'multer';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}


exports.create  = async (req: Request,res: Response) => {
    try{
        const {name} = req.body;

        const file = req.file ;

        const picture = new Picture({
            name,
            src: file?.path
        })

        await picture.save()
    res.json(({picture, msg:"Imagem salva com sucesso"}))       

    }catch(error){
        console.error('Erro ao salvar imagem:', error)
        res.status(500).json({message: "erro ao salvar imagem "
        })
       
    }
}