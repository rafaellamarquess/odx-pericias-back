import mongoose, { Schema, Document } from 'mongoose';

// Interface para tipagem do documento
export interface IPicture extends Document {
  name: string;
  src: string;
}

const PictureSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  src: { 
    type: String, 
    required: true 
  }
});

// Exportação padrão usando ES Modules
const Picture = mongoose.model<IPicture>('Picture', PictureSchema);
export default Picture;