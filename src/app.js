// backend/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas - Usando nombres en español para compatibilidad con frontend
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);  // Cambiado de /api/users a /api/usuarios
app.use('/api/notas', noteRoutes);      // Cambiado de /api/notes a /api/notas
app.use('/api/comentarios', commentRoutes);  // Nueva ruta para comentarios

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use(errorHandler);

export default app;
