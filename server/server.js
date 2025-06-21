import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bookRoutes from './routes/books.js';

dotenv.config();
const app = express();
// In your server.js
import authRoutes, { verifyToken, requireAdmin } from './routes/auth.js';

app.use('/api/auth', authRoutes);

// Protect admin routes
app.use('/api/books/upload', verifyToken, requireAdmin);
app.delete('/api/books/:id', verifyToken, requireAdmin);
// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Content-Length', 'Content-Type', 'Content-Disposition']
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('📦 MongoDB connected'))
  .catch((err) => console.error(err));

app.use('/api/books', bookRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));