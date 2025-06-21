import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  pages: Number,
  fileId: mongoose.Schema.Types.ObjectId,
  imageFileId: mongoose.Schema.Types.ObjectId,
  md5: String,
}, { timestamps: true });

export default mongoose.model('Book', BookSchema);